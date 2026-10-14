const httpStatus = require('http-status');
const catchAsync = require('../../utilities/catchAsync');
const sendResponse = require('../../utilities/sendResponse');
const AppError = require('../../error/appError');
const User = require('../../models/user.model');
const Organisation = require('../models/organisation.model');
const OrganisationMembership = require('../models/organisationMembership.model');
const Vessel = require('../models/vessel.model');
const Resort = require('../models/resort.model');
const Enquiry = require('../models/enquiry.model');
const ImportBatch = require('../models/importBatch.model');
const DuplicateResolution = require('../models/duplicateResolution.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditLog.model');
const ExternalSourceMapping = require('../models/externalSourceMapping.model');
const SourceConfig = require('../models/sourceConfig.model');
const VerificationRecord = require('../models/verificationRecord.model');
const ClaimInvitationHistory = require('../models/claimInvitationHistory.model');
const WebsiteSource = require('../models/websiteSource.model');
const AvailabilityEffective = require('../models/availabilityEffective.model');
const AvailabilitySnapshot = require('../models/availabilitySnapshot.model');
const AvailabilityOverride = require('../models/availabilityOverride.model');
const AvailabilityHistory = require('../models/availabilityHistory.model');
const DomainEvent = require('../models/domainEvent.model');
const Location = require('../models/location.model');
const { parsePagination, pagedResult } = require('../services/pagination.service');
const { createPreview } = require('../services/catalogImport.service');
const { upsertMapping, upsertSourceConfig } = require('../services/source.service');
const { setVerification } = require('../services/verification.service');
const { calculateCompleteness, refreshProductCompleteness } = require('../services/completeness.service');
const { createClaimInvitation, revokeClaimInvitation, expireHistory } = require('../services/claim.service');
const { identityFromInput, applyManualOverride, clearManualOverride, resolveAvailability, refreshAvailabilityStates } = require('../services/availability.service');
const { setListingStatus, assignDestination } = require('../services/catalogueAdmin.service');
const { logAudit } = require('../services/audit.service');
const { notifyAdminsInApp, createInAppNotification } = require('../services/notification.service');
const { publishDomainEvent } = require('../services/domainEvent.service');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const modelFor = (productType) => productType === 'resort' ? Resort : productType === 'vessel' ? Vessel : null;

const listImports = catchAsync(async (req, res) => {
  const filter = {};
  for (const key of ['status','sourceType','adapterType','productType']) if (req.query[key]) filter[key] = req.query[key];
  const clauses = [];
  if (req.query.hasErrors === 'true') clauses.push({ $or: [{ 'summary.error': { $gt: 0 } }, { 'summary.commitErrors': { $gt: 0 } }] });
  if (req.query.q) clauses.push({ $or: [{ sourceFilename: new RegExp(escapeRegex(req.query.q), 'i') }, { operationId: new RegExp(escapeRegex(req.query.q), 'i') }] });
  if (clauses.length) filter.$and = clauses;
  const { page,limit,skip,sort } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100, allowedSort: ['createdAt','updatedAt','committedAt','status'], defaultSort: '-createdAt' });
  const [items,total] = await Promise.all([
    ImportBatch.find(filter).select('-rows -rowErrors -results').populate('createdBy committedBy','fullName email').sort(sort).skip(skip).limit(limit).lean(),
    ImportBatch.countDocuments(filter),
  ]);
  sendResponse(res,{statusCode:200,success:true,message:'Import history retrieved',data:pagedResult({items,total,page,limit})});
});

const importErrors = catchAsync(async (req,res)=>{
  const batch=await ImportBatch.findById(req.params.batchId).lean();
  if(!batch) throw new AppError(404,'Import batch not found');
  let rows=[...(batch.rows||[]).filter(r=>['ERROR','DUPLICATE_REVIEW'].includes(r.action)),...(batch.rowErrors||[]).map(e=>({...e,action:'COMMIT_ERROR'}))];
  if(req.query.type) rows=rows.filter(r=>String(r.action).toLowerCase()===String(req.query.type).toLowerCase());
  if(req.query.q){const q=String(req.query.q).toLowerCase();rows=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q));}
  const page=Math.max(1,Number(req.query.page||1)),limit=Math.min(100,Math.max(1,Number(req.query.limit||25))),total=rows.length;
  rows=rows.slice((page-1)*limit,page*limit);
  sendResponse(res,{statusCode:200,success:true,message:'Import errors retrieved',data:pagedResult({items:rows,total,page,limit})});
});

const downloadImportErrors = catchAsync(async (req,res)=>{
  const batch=await ImportBatch.findById(req.params.batchId).lean();
  if(!batch) throw new AppError(404,'Import batch not found');
  const rows=[...(batch.rows||[]).filter(r=>['ERROR','DUPLICATE_REVIEW'].includes(r.action)).map(r=>({row:r.rowNumber,action:r.action,message:r.reason||''})),...(batch.rowErrors||[]).map(r=>({row:r.row,action:r.action||'COMMIT_ERROR',message:r.message||''}))];
  const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv=['row,action,message',...rows.map(r=>[r.row,r.action,r.message].map(quote).join(','))].join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="import-${batch._id}-errors.csv"`);res.status(200).send(csv);
});

const retryImport = catchAsync(async(req,res)=>{
  const prior=await ImportBatch.findById(req.params.batchId).lean();
  if(!prior) throw new AppError(404,'Import batch not found');
  if(!Array.isArray(req.body.correctedRows)||!req.body.correctedRows.length) throw new AppError(400,'correctedRows must be a non-empty array');
  const data=await createPreview({productType:prior.productType,rows:req.body.correctedRows,sourceType:prior.sourceType,sourceFilename:`${prior.sourceFilename||'import'}-retry`,createdBy:req.v2User._id,adapterType:prior.adapterType,schemaVersion:prior.schemaVersion,operationId:req.operationId,retryOfBatch:prior._id});
  await logAudit({req,action:'catalog.import.retry_preview',entityType:'importBatch',entityId:data.batchId,after:{retryOfBatch:prior._id,summary:data.summary},source:'admin'});
  sendResponse(res,{statusCode:201,success:true,message:'Retry preview created',data});
});

const listDuplicates = catchAsync(async(req,res)=>{
  const page=Math.max(1,Number(req.query.page||1)),limit=Math.min(100,Math.max(1,Number(req.query.limit||25))),skip=(page-1)*limit;
  const match={'rows.action':'DUPLICATE_REVIEW'};
  if(req.query.productType) match.productType=req.query.productType;
  const pipeline=[{$match:match},{$unwind:'$rows'},{$match:{'rows.action':'DUPLICATE_REVIEW'}},{$sort:{createdAt:-1,_id:-1}}];
  const [items,count] = await Promise.all([
    ImportBatch.aggregate([...pipeline,{$skip:skip},{$limit:limit},{$project:{batchId:'$_id',productType:1,sourceType:1,sourceFilename:1,createdAt:1,row:'$rows'}}]),
    ImportBatch.aggregate([...pipeline,{$count:'total'}]),
  ]);
  const total=count[0]?.total||0;
  sendResponse(res,{statusCode:200,success:true,message:'Duplicate review queue retrieved',data:pagedResult({items,total,page,limit})});
});

const resolveDuplicate = catchAsync(async(req,res)=>{
  const batch=await ImportBatch.findById(req.params.batchId);
  if(!batch) throw new AppError(404,'Import batch not found');
  if(!['preview','awaiting_confirmation'].includes(batch.status)) throw new AppError(409,'Only uncommitted batches can be reconciled');
  const row=batch.rows.find(r=>Number(r.rowNumber)===Number(req.params.rowNumber));
  if(!row||row.action!=='DUPLICATE_REVIEW') throw new AppError(404,'Duplicate review row not found');
  const decision=req.body.decision;
  if(!['match_existing','create_new','not_duplicate','merge_fields'].includes(decision)) throw new AppError(400,'Unsupported duplicate decision');
  let nextAction='CREATE';
  if(['match_existing','merge_fields'].includes(decision)){
    if(!req.body.productId) throw new AppError(400,'productId is required to match existing');
    const Model=modelFor(batch.productType); const product=await Model.findById(req.body.productId).lean();
    if(!product) throw new AppError(404,'Selected listing not found');
    row.productMatchId=product._id;row.productMatchedUpdatedAt=product.updatedAt;row.organisationMatchId=req.body.organisationId||product.organisation;nextAction='UPDATE';
    if(decision==='merge_fields'&&req.body.fieldSelections&&typeof req.body.fieldSelections==='object'){
      for(const [key,choice] of Object.entries(req.body.fieldSelections)) if(choice==='existing'&&Object.prototype.hasOwnProperty.call(product,key)) row.product[key]=product[key];
    }
  } else { delete row.productMatchId; delete row.productMatchedUpdatedAt; if(req.body.organisationId) row.organisationMatchId=req.body.organisationId; }
  row.action=nextAction;row.reason=`Resolved by Admin: ${decision}`;
  batch.summary.duplicateReview=Math.max(0,(batch.summary.duplicateReview||0)-1);batch.summary[nextAction==='UPDATE'?'update':'create']=(batch.summary[nextAction==='UPDATE'?'update':'create']||0)+1;
  batch.markModified('rows');batch.markModified('summary');await batch.save();
  const resolution=await DuplicateResolution.findOneAndUpdate({importBatch:batch._id,rowNumber:Number(req.params.rowNumber)},{importBatch:batch._id,rowNumber:Number(req.params.rowNumber),productType:batch.productType,decision,organisationId:row.organisationMatchId,productId:row.productMatchId,fieldSelections:req.body.fieldSelections||{},decidedBy:req.v2User._id,operationId:req.operationId,notes:req.body.notes},{new:true,upsert:true,runValidators:true});
  if(req.body.providerKey&&req.body.externalId&&row.productMatchId) await upsertMapping({providerKey:req.body.providerKey,providerName:req.body.providerName,sourceType:batch.sourceType,internalEntityType:batch.productType,internalEntityId:row.productMatchId,externalEntityType:batch.productType,externalId:req.body.externalId,organisation:row.organisationMatchId});
  await logAudit({req,organisation:row.organisationMatchId,action:'import.duplicate.resolved',entityType:'importBatch',entityId:batch._id,after:{rowNumber:row.rowNumber,decision,nextAction,productId:row.productMatchId},source:'admin'});
  sendResponse(res,{statusCode:200,success:true,message:'Duplicate resolved',data:{resolution,row,summary:batch.summary}});
});

const listNotifications = catchAsync(async(req,res)=>{
  const filter={audience:'admin',$or:[{recipientUser:req.v2User._id},{recipientUser:{$exists:false}}]};
  if(req.query.unread==='true') filter.readAt={$exists:false};
  if(req.query.type) filter.type=req.query.type;
  const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:25,maxLimit:100,allowedSort:['createdAt','readAt'],defaultSort:'-createdAt'});
  const [items,total,unread]=await Promise.all([Notification.find(filter).sort(sort).skip(skip).limit(limit).lean(),Notification.countDocuments(filter),Notification.countDocuments({...filter,readAt:{$exists:false}})]);
  sendResponse(res,{statusCode:200,success:true,message:'Notifications retrieved',data:{...pagedResult({items,total,page,limit}),unread}});
});
const markNotificationRead=catchAsync(async(req,res)=>{const item=await Notification.findOneAndUpdate({_id:req.params.id,audience:'admin',$or:[{recipientUser:req.v2User._id},{recipientUser:{$exists:false}}]},{readAt:new Date()},{new:true});if(!item)throw new AppError(404,'Notification not found');sendResponse(res,{statusCode:200,success:true,message:'Notification marked read',data:item});});
const markAllNotificationsRead=catchAsync(async(req,res)=>{const result=await Notification.updateMany({audience:'admin',$or:[{recipientUser:req.v2User._id},{recipientUser:{$exists:false}}],readAt:{$exists:false}},{$set:{readAt:new Date()}});sendResponse(res,{statusCode:200,success:true,message:'Notifications marked read',data:{updated:result.modifiedCount}});});

const listAudit = catchAsync(async(req,res)=>{
  const filter={};
  for(const key of ['action','entityType','source','organisation','actorUser','operationId']) if(req.query[key]) filter[key]=req.query[key];
  if(req.query.entityId) filter.entityId=req.query.entityId;
  if(req.query.q) filter.$or=[{action:new RegExp(escapeRegex(req.query.q),'i')},{entityType:new RegExp(escapeRegex(req.query.q),'i')},{operationId:new RegExp(escapeRegex(req.query.q),'i')}];
  if(req.query.from||req.query.to){filter.createdAt={};if(req.query.from)filter.createdAt.$gte=new Date(req.query.from);if(req.query.to)filter.createdAt.$lte=new Date(req.query.to);}
  const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:30,maxLimit:100,allowedSort:['createdAt','action'],defaultSort:'-createdAt'});
  const [items,total]=await Promise.all([AuditLog.find(filter).populate('actorUser','fullName email').populate('organisation','name').sort(sort).skip(skip).limit(limit).lean(),AuditLog.countDocuments(filter)]);
  sendResponse(res,{statusCode:200,success:true,message:'Audit log retrieved',data:pagedResult({items,total,page,limit})});
});

const listMappings=catchAsync(async(req,res)=>{const filter={};for(const key of ['providerKey','sourceType','internalEntityType','internalEntityId','externalEntityType','externalId','organisation'])if(req.query[key])filter[key]=req.query[key];const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:25,maxLimit:100,allowedSort:['createdAt','updatedAt','providerKey'],defaultSort:'-updatedAt'});const [items,total]=await Promise.all([ExternalSourceMapping.find(filter).sort(sort).skip(skip).limit(limit).lean(),ExternalSourceMapping.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Source mappings retrieved',data:pagedResult({items,total,page,limit})});});
const saveMapping=catchAsync(async(req,res)=>{const item=await upsertMapping(req.body);await logAudit({req,organisation:item.organisation,action:'source.mapping.upsert',entityType:'sourceMapping',entityId:item._id,after:item.toObject(),source:'admin'});sendResponse(res,{statusCode:200,success:true,message:'Source mapping saved',data:item});});
const listSourceConfigs=catchAsync(async(req,res)=>{const filter={};if(req.query.organisation)filter.organisation=req.query.organisation;if(req.query.sourceType)filter.sourceType=req.query.sourceType;if(req.query.status)filter.status=req.query.status;const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:50,maxLimit:100,allowedSort:['priority','providerName','updatedAt','status'],defaultSort:'priority'});const [items,total]=await Promise.all([SourceConfig.find(filter).sort(sort).skip(skip).limit(limit).lean(),SourceConfig.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Source configurations retrieved',data:pagedResult({items,total,page,limit})});});
const saveSourceConfig=catchAsync(async(req,res)=>{const item=await upsertSourceConfig(req.body);await logAudit({req,organisation:item.organisation,action:'source.config.upsert',entityType:'sourceConfig',entityId:item._id,after:item.toObject(),source:'admin'});sendResponse(res,{statusCode:200,success:true,message:'Source configuration saved',data:item});});

const verifyEntity=catchAsync(async(req,res)=>{const data=await setVerification({entityType:req.params.entityType,entityId:req.params.id,status:req.body.status||'deeparture_verified',actorUserId:req.v2User._id,sourceType:req.body.sourceType||'admin_manual',sourceRef:req.body.sourceRef,scope:req.body.scope,notes:req.body.notes,operationId:req.operationId});await logAudit({req,organisation:data.record.organisation,action:'verification.changed',entityType:req.params.entityType,entityId:req.params.id,after:{status:data.record.status,scope:data.record.verificationScope},source:'admin'});await publishDomainEvent({name:'verification.changed',aggregateType:req.params.entityType,aggregateId:req.params.id,organisation:data.record.organisation,actorUser:req.v2User._id,operationId:req.operationId,payload:{status:data.record.status}});sendResponse(res,{statusCode:200,success:true,message:'Verification updated',data});});
const verificationHistory=catchAsync(async(req,res)=>{const filter={entityType:req.params.entityType,entityId:req.params.id};const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:25,maxLimit:100,allowedSort:['createdAt','status'],defaultSort:'-createdAt'});const [items,total]=await Promise.all([VerificationRecord.find(filter).populate('verifiedByUser','fullName email').sort(sort).skip(skip).limit(limit).lean(),VerificationRecord.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Verification history retrieved',data:pagedResult({items,total,page,limit})});});

const claimHistory=catchAsync(async(req,res)=>{await expireHistory(req.params.organisationId);const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:20,maxLimit:100,allowedSort:['sentAt','createdAt','expiresAt'],defaultSort:'-sentAt'});const filter={organisation:req.params.organisationId};const [items,total]=await Promise.all([ClaimInvitationHistory.find(filter).populate('createdBy','fullName email').sort(sort).skip(skip).limit(limit).lean(),ClaimInvitationHistory.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Claim invitation history retrieved',data:pagedResult({items,total,page,limit})});});
const resendClaim=catchAsync(async(req,res)=>{const previous=await ClaimInvitationHistory.findOne({_id:req.params.historyId,organisation:req.params.organisationId});if(!previous)throw new AppError(404,'Claim invitation history not found');const result=await createClaimInvitation({organisationId:req.params.organisationId,email:req.body.email||previous.invitedEmail,createdBy:req.v2User._id,operationId:req.operationId});await logAudit({req,organisation:req.params.organisationId,action:'claim.invitation.resent',entityType:'claimInvitation',entityId:result.historyId,before:{historyId:previous._id,status:previous.status,invitedEmail:previous.invitedEmail},after:{historyId:result.historyId,expiresAt:result.expiresAt,invitedEmail:req.body.email||previous.invitedEmail},source:'admin'});sendResponse(res,{statusCode:200,success:true,message:'Claim invitation resent',data:{expiresAt:result.expiresAt,historyId:result.historyId}});});
const revokeClaim=catchAsync(async(req,res)=>{const before=await ClaimInvitationHistory.findOne({_id:req.params.historyId,organisation:req.params.organisationId}).lean();const item=await revokeClaimInvitation({organisationId:req.params.organisationId,historyId:req.params.historyId,actorUserId:req.v2User._id,reason:req.body.reason,operationId:req.operationId});await logAudit({req,organisation:req.params.organisationId,action:'claim.invitation.revoked',entityType:'claimInvitation',entityId:item._id,before,after:item.toObject(),source:'admin'});sendResponse(res,{statusCode:200,success:true,message:'Claim invitation revoked',data:item});});

const productCompleteness=catchAsync(async(req,res)=>{const Model=modelFor(req.params.productType);if(!Model)throw new AppError(400,'Unsupported product type');const product=await Model.findById(req.params.id).lean();if(!product)throw new AppError(404,'Listing not found');const data=await calculateCompleteness({productType:req.params.productType,product});sendResponse(res,{statusCode:200,success:true,message:'Completeness calculated',data});});
const refreshCompleteness=catchAsync(async(req,res)=>{const data=await refreshProductCompleteness({productType:req.params.productType,productId:req.params.id});if(!data)throw new AppError(404,'Listing not found');sendResponse(res,{statusCode:200,success:true,message:'Completeness refreshed',data});});

const organisationActivity=catchAsync(async(req,res)=>{
  const org=await Organisation.findById(req.params.organisationId).lean();if(!org)throw new AppError(404,'Organisation not found');
  const [memberships,vessels,resorts,enquiries,claims,mappings,sourceConfigs,audit,imports,verifications,notifications]=await Promise.all([
    OrganisationMembership.find({organisation:org._id}).populate('user','fullName email role status updatedAt').sort({createdAt:1}).lean(),
    Vessel.find({organisation:org._id}).select('name slug listingStatus completenessScore updatedAt').sort({updatedAt:-1}).limit(50).lean(),
    Resort.find({organisation:org._id}).select('name slug listingStatus completenessScore updatedAt').sort({updatedAt:-1}).limit(50).lean(),
    Enquiry.find({organisation:org._id}).select('status customer.name productType createdAt updatedAt').sort({createdAt:-1}).limit(50).lean(),
    ClaimInvitationHistory.find({organisation:org._id}).sort({sentAt:-1}).limit(50).lean(),
    ExternalSourceMapping.find({organisation:org._id}).sort({updatedAt:-1}).limit(50).lean(),
    SourceConfig.find({organisation:org._id}).sort({priority:1,providerName:1}).lean(),
    AuditLog.find({organisation:org._id}).sort({createdAt:-1}).limit(50).lean(),
    ImportBatch.find({'results.organisationId':org._id}).select('-rows').sort({createdAt:-1}).limit(25).lean(),
    VerificationRecord.find({organisation:org._id}).sort({createdAt:-1}).limit(25).lean(),
    Notification.find({recipientOrganisation:org._id}).sort({createdAt:-1}).limit(25).lean(),
  ]);
  const issues={
    unreadNotifications:notifications.filter(x=>!x.readAt).length,
    incompleteListings:[...vessels,...resorts].filter(x=>Number(x.completenessScore||0)<70).length,
    sourceErrors:sourceConfigs.filter(x=>['warning','error'].includes(x.status)).length,
    pendingEnquiries:enquiries.filter(x=>['new','admin_approved'].includes(x.status)).length,
  };
  sendResponse(res,{statusCode:200,success:true,message:'Organisation activity retrieved',data:{organisation:org,memberships,vessels,resorts,enquiries,claims,mappings,sourceConfigs,audit,imports,verifications,notifications,issues}});
});

const listWebsiteSources=catchAsync(async(req,res)=>{const filter={};for(const key of ['status','productType','organisation'])if(req.query[key])filter[key]=req.query[key];if(req.query.q)filter.$or=[{productName:new RegExp(escapeRegex(req.query.q),'i')},{sourceUrl:new RegExp(escapeRegex(req.query.q),'i')}];const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:25,maxLimit:100,allowedSort:['createdAt','updatedAt','status'],defaultSort:'-createdAt'});const [items,total]=await Promise.all([WebsiteSource.find(filter).populate('organisation','name').sort(sort).skip(skip).limit(limit).lean(),WebsiteSource.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Website source queue retrieved',data:pagedResult({items,total,page,limit})});});
const createWebsiteSource=catchAsync(async(req,res)=>{const input={};for(const key of ['organisation','productType','sourceUrl','productName','notes'])if(req.body[key]!==undefined)input[key]=req.body[key];const item=await WebsiteSource.create({...input,status:'queued',createdBy:req.v2User._id,operationId:req.operationId});await logAudit({req,organisation:item.organisation,action:'website_source.queued',entityType:'websiteSource',entityId:item._id,after:item.toObject(),source:'admin'});sendResponse(res,{statusCode:201,success:true,message:'Website source queued',data:item});});
const updateWebsiteSource=catchAsync(async(req,res)=>{const allowed=['status','notes','organisation','productType','sourceUrl','productName','draftProductId'];const item=await WebsiteSource.findById(req.params.id);if(!item)throw new AppError(404,'Website source not found');if(req.body.expectedUpdatedAt&&new Date(req.body.expectedUpdatedAt).getTime()!==new Date(item.updatedAt).getTime())throw new AppError(409,'Website source changed since it was loaded',{code:'conflict',details:{currentUpdatedAt:item.updatedAt}});const before=item.toObject();for(const key of allowed)if(req.body[key]!==undefined)item[key]=req.body[key];if(['approved','rejected'].includes(item.status)){item.reviewedBy=req.v2User._id;item.reviewedAt=new Date();}await item.save();await logAudit({req,organisation:item.organisation,action:'website_source.update',entityType:'websiteSource',entityId:item._id,before,after:item.toObject(),source:'admin'});sendResponse(res,{statusCode:200,success:true,message:'Website source updated',data:item});});

const refreshAvailabilityMaintenance=catchAsync(async(req,res)=>{const results=await refreshAvailabilityStates({limit:Math.min(200,Math.max(1,Number(req.body?.limit||100))),minResolvedAgeMinutes:Math.max(1,Number(req.body?.minResolvedAgeMinutes||10)),actorUserId:req.v2User._id,operationId:req.operationId});sendResponse(res,{statusCode:200,success:true,message:'Availability freshness/override maintenance completed',data:{processed:results.length,failed:results.filter(x=>!x.success).length,results,operationId:req.operationId}});});

const listAvailability=catchAsync(async(req,res)=>{const filter={};for(const key of ['productType','organisation','status','freshnessState','sourceType'])if(req.query[key])filter[key]=req.query[key];if(req.query.conflict==='true')filter.conflictState=true;if(req.query.override==='true')filter.manualOverride=true;const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:30,maxLimit:100,allowedSort:['resolvedAt','sourceUpdatedAt','status','freshnessState'],defaultSort:'-resolvedAt'});const [items,total]=await Promise.all([AvailabilityEffective.find(filter).populate('vessel','name').populate('resort','name').populate('departure','startDate endDate').populate('cabinType','name').populate('roomType','name').sort(sort).skip(skip).limit(limit).lean(),AvailabilityEffective.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Effective availability retrieved',data:pagedResult({items,total,page,limit})});});
const availabilitySources=catchAsync(async(req,res)=>{const filter={inventoryKey:req.params.inventoryKey};const snapshots=await AvailabilitySnapshot.find(filter).populate('sourceConfig').sort({sourceUpdatedAt:-1}).lean();const effective=await AvailabilityEffective.findOne(filter).lean();const overrides=await AvailabilityOverride.find(filter).sort({createdAt:-1}).limit(20).lean();sendResponse(res,{statusCode:200,success:true,message:'Availability sources retrieved',data:{effective,snapshots,overrides}});});
const availabilityHistory=catchAsync(async(req,res)=>{const filter={inventoryKey:req.params.inventoryKey};const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:30,maxLimit:100,allowedSort:['createdAt','eventType'],defaultSort:'-createdAt'});const [items,total]=await Promise.all([AvailabilityHistory.find(filter).populate('actorUser','fullName email').sort(sort).skip(skip).limit(limit).lean(),AvailabilityHistory.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Availability history retrieved',data:pagedResult({items,total,page,limit})});});
const setAvailabilityOverride=catchAsync(async(req,res)=>{const identity=await identityFromInput({...req.body,organisationId:req.body.organisationId});if(identity.productType==='vessel'&&req.body.status==='stop_sell')throw new AppError(400,'stop_sell is not valid for vessel availability');const before=await AvailabilityEffective.findOne({inventoryKey:identity.inventoryKey}).lean();if(req.body.expectedEffectiveUpdatedAt){const expected=new Date(req.body.expectedEffectiveUpdatedAt).getTime(),current=before?.updatedAt?new Date(before.updatedAt).getTime():null;if(!Number.isFinite(expected)||current===null||expected!==current)throw new AppError(409,'Availability changed since it was loaded',{code:'conflict',details:{currentUpdatedAt:before?.updatedAt,expectedUpdatedAt:req.body.expectedEffectiveUpdatedAt}});}const data=await applyManualOverride({identity,values:req.body,reason:req.body.reason,expiresAt:req.body.expiresAt,actorUserId:req.v2User._id,operationId:req.operationId});await logAudit({req,organisation:identity.organisationId,action:'availability.override.set',entityType:'availability',entityId:data.override?._id,before,after:{inventoryKey:identity.inventoryKey,override:data.override?.toObject?.()||data.override,effective:data.effective},source:'admin'});await notifyAdminsInApp({type:'availability.override',title:'Availability override applied',message:`Manual override applied to ${identity.inventoryKey}.`,relatedRecordType:'availability',actionTarget:'/admin/v2/availability',operationId:req.operationId});sendResponse(res,{statusCode:201,success:true,message:'Availability override applied',data:{inventoryKey:identity.inventoryKey,...data}});});
const clearAvailabilityOverride=catchAsync(async(req,res)=>{const effective=await AvailabilityEffective.findOne({inventoryKey:req.params.inventoryKey}).lean();if(!effective)throw new AppError(404,'Effective availability not found');const overrideBefore=await AvailabilityOverride.findOne({_id:req.params.overrideId,inventoryKey:req.params.inventoryKey}).lean();const identity=await identityFromInput(effective.productType==='vessel'?{productType:'vessel',departureId:effective.departure,cabinType:effective.cabinType,organisationId:effective.organisation}:{productType:'resort',roomTypeId:effective.roomType,date:effective.date,organisationId:effective.organisation});const data=await clearManualOverride({identity,overrideId:req.params.overrideId,actorUserId:req.v2User._id,operationId:req.operationId});await logAudit({req,organisation:identity.organisationId,action:'availability.override.cleared',entityType:'availability',entityId:req.params.overrideId,before:{override:overrideBefore,effective},after:{inventoryKey:identity.inventoryKey,effective:data.effective},source:'admin'});sendResponse(res,{statusCode:200,success:true,message:'Availability override cleared',data});});
const reResolveAvailability=catchAsync(async(req,res)=>{const effective=await AvailabilityEffective.findOne({inventoryKey:req.params.inventoryKey}).lean();if(!effective)throw new AppError(404,'Effective availability not found');const identity=await identityFromInput(effective.productType==='vessel'?{productType:'vessel',departureId:effective.departure,cabinType:effective.cabinType,organisationId:effective.organisation}:{productType:'resort',roomTypeId:effective.roomType,date:effective.date,organisationId:effective.organisation});const data=await resolveAvailability(identity,{actorUserId:req.v2User._id,operationId:req.operationId,reason:'admin_reresolve'});await logAudit({req,organisation:identity.organisationId,action:'availability.reresolved',entityType:'availability',entityId:effective._id,before:effective,after:data.effective,source:'admin'});sendResponse(res,{statusCode:200,success:true,message:'Availability re-resolved',data});});

const advancedDashboard=catchAsync(async(req,res)=>{
  const now=new Date();
  const [needsReview,staleListings,importErrors,unclaimed,expiredInvites,incomplete,enquiries,staleAvailability,conflicts,overrides,sourceErrors,recentClaims]=await Promise.all([
    Promise.all([Vessel.countDocuments({listingStatus:'pending_review'}),Resort.countDocuments({listingStatus:'pending_review'})]).then(x=>x[0]+x[1]),
    Promise.all([Vessel.countDocuments({$or:[{lastCheckedAt:{$lt:new Date(now-90*86400000)}},{lastCheckedAt:{$exists:false}}]}),Resort.countDocuments({$or:[{lastCheckedAt:{$lt:new Date(now-90*86400000)}},{lastCheckedAt:{$exists:false}}]})]).then(x=>x[0]+x[1]),
    ImportBatch.countDocuments({$or:[{'summary.error':{$gt:0}},{'summary.commitErrors':{$gt:0}}]}),Organisation.countDocuments({type:'operator',status:'unclaimed'}),
    ClaimInvitationHistory.countDocuments({status:'sent',expiresAt:{$lt:now}}),Promise.all([Vessel.countDocuments({completenessScore:{$lt:70}}),Resort.countDocuments({completenessScore:{$lt:70}})]).then(x=>x[0]+x[1]),
    Enquiry.countDocuments({status:'new'}),AvailabilityEffective.countDocuments({freshnessState:'stale'}),AvailabilityEffective.countDocuments({conflictState:true}),AvailabilityEffective.countDocuments({manualOverride:true}),SourceConfig.countDocuments({status:'error'}),Organisation.countDocuments({claimedAt:{$gte:new Date(now-30*86400000)}}),
  ]);
  sendResponse(res,{statusCode:200,success:true,message:'Advanced dashboard metrics',data:{needsReview,staleListings,importErrors,unclaimed,expiredInvites,incomplete,enquiries,staleAvailability,conflicts,manualOverrides:overrides,sourceErrors,recentClaims}});
});

const bulkAction=catchAsync(async(req,res)=>{
  const ids=Array.isArray(req.body.ids)?[...new Set(req.body.ids.map(String))]:[];if(!ids.length)throw new AppError(400,'ids must be a non-empty array');if(ids.length>100)throw new AppError(413,'Bulk action is limited to 100 records',{code:'rate_or_limit_error',details:{maxBatchSize:100}});
  const action=req.body.action,productType=req.body.productType;const results=[];
  for(const id of ids){try{let item;if(['publish','restrict','archive','mark_review'].includes(action)){const status={publish:'published',restrict:'restricted',archive:'archived',mark_review:'pending_review'}[action];item=await setListingStatus({productType,id,listingStatus:status,req,operationId:req.operationId});}else if(action==='assign_destination'){item=await assignDestination({productType,id,locationId:req.body.locationId,req,operationId:req.operationId});}else if(action==='send_invitation'){const org=await Organisation.findById(id);if(!org)throw new AppError(404,'Organisation not found');item=await createClaimInvitation({organisationId:org._id,email:org.primaryEmail,createdBy:req.v2User._id,operationId:req.operationId});}else throw new AppError(400,'Unsupported bulk action');results.push({id,success:true,resultId:item?._id||item?.organisation?._id});}catch(error){results.push({id,success:false,code:error.code||'error',message:error.message});}}
  await logAudit({req,action:'bulk.action',entityType:productType||'organisation',after:{action,count:ids.length,success:results.filter(x=>x.success).length,failed:results.filter(x=>!x.success).length},source:'admin',metadata:{ids}});
  await publishDomainEvent({name:'bulk.completed',aggregateType:productType||'organisation',actorUser:req.v2User._id,operationId:req.operationId,payload:{action,results}});
  sendResponse(res,{statusCode:200,success:true,message:'Bulk action processed',data:{operationId:req.operationId,results,summary:{total:ids.length,succeeded:results.filter(x=>x.success).length,failed:results.filter(x=>!x.success).length}}});
});

const operationalReport=catchAsync(async(req,res)=>{
  const now=new Date();
  const last30=new Date(now.getTime()-30*86400000);
  const staleCheck=new Date(now.getTime()-90*86400000);
  const [vesselTotal,resortTotal,vesselPublished,resortPublished,vesselCreated30,resortCreated30,claimed,unclaimed,imports,importErrors,enquiryByStatus,staleAvailability,availabilityConflicts,manualOverrides,sourceAttention,incompleteV,incompleteR,staleListings,unverifiedV,unverifiedR]=await Promise.all([
    Vessel.countDocuments(),Resort.countDocuments(),Vessel.countDocuments({listingStatus:'published'}),Resort.countDocuments({listingStatus:'published'}),
    Vessel.countDocuments({createdAt:{$gte:last30}}),Resort.countDocuments({createdAt:{$gte:last30}}),
    Organisation.countDocuments({type:'operator',status:{$in:['claimed','verified']}}),Organisation.countDocuments({type:'operator',status:{$in:['unclaimed','invited']}}),
    ImportBatch.countDocuments({status:{$in:['completed','completed_with_errors']}}),ImportBatch.countDocuments({status:'completed_with_errors'}),
    Enquiry.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]),AvailabilityEffective.countDocuments({freshnessState:'stale'}),AvailabilityEffective.countDocuments({conflictState:true}),AvailabilityEffective.countDocuments({manualOverride:true}),
    SourceConfig.countDocuments({status:{$in:['warning','error']}}),Vessel.countDocuments({completenessScore:{$lt:70}}),Resort.countDocuments({completenessScore:{$lt:70}}),
    Promise.all([Vessel.countDocuments({$or:[{lastCheckedAt:{$lt:staleCheck}},{lastCheckedAt:{$exists:false}}]}),Resort.countDocuments({$or:[{lastCheckedAt:{$lt:staleCheck}},{lastCheckedAt:{$exists:false}}]})]).then(x=>x[0]+x[1]),
    Vessel.countDocuments({verificationStatus:{$ne:'deeparture_verified'}}),Resort.countDocuments({verificationStatus:{$ne:'deeparture_verified'}}),
  ]);
  sendResponse(res,{statusCode:200,success:true,message:'Operational report',data:{
    catalogue:{total:vesselTotal+resortTotal,vessels:vesselTotal,resorts:resortTotal,published:vesselPublished+resortPublished,createdLast30Days:vesselCreated30+resortCreated30,staleChecks:staleListings},
    organisations:{claimed,unclaimed},
    imports:{completed:imports,withErrors:importErrors,errorRate:imports?Number((importErrors/imports*100).toFixed(1)):0},
    enquiries:Object.fromEntries(enquiryByStatus.map(x=>[x._id,x.count])),
    availability:{stale:staleAvailability,conflicts:availabilityConflicts,manualOverrides,sourcesRequiringAttention:sourceAttention},
    incomplete:{vessels:incompleteV,resorts:incompleteR},
    verification:{unverifiedOrOperatorVerified:unverifiedV+unverifiedR,vessels:unverifiedV,resorts:unverifiedR},
  }});
});

const listEvents=catchAsync(async(req,res)=>{const filter={};if(req.query.name)filter.name=req.query.name;if(req.query.status)filter.status=req.query.status;const {page,limit,skip,sort}=parsePagination(req.query,{defaultLimit:25,maxLimit:100,allowedSort:['createdAt','name','status'],defaultSort:'-createdAt'});const [items,total]=await Promise.all([DomainEvent.find(filter).sort(sort).skip(skip).limit(limit).lean(),DomainEvent.countDocuments(filter)]);sendResponse(res,{statusCode:200,success:true,message:'Domain events retrieved',data:pagedResult({items,total,page,limit})});});

module.exports={listImports,importErrors,downloadImportErrors,retryImport,listDuplicates,resolveDuplicate,listNotifications,markNotificationRead,markAllNotificationsRead,listAudit,listMappings,saveMapping,listSourceConfigs,saveSourceConfig,verifyEntity,verificationHistory,claimHistory,resendClaim,revokeClaim,productCompleteness,refreshCompleteness,organisationActivity,listWebsiteSources,createWebsiteSource,updateWebsiteSource,refreshAvailabilityMaintenance,listAvailability,availabilitySources,availabilityHistory,setAvailabilityOverride,clearAvailabilityOverride,reResolveAvailability,advancedDashboard,bulkAction,operationalReport,listEvents};
