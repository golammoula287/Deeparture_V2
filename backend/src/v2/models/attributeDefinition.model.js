const { Schema, model } = require("mongoose");

const attributeDefinitionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true },
    group: {
      type: String,
      enum: ["facility", "dietary", "accessibility", "diving", "accommodation", "sustainability", "other"],
      default: "other",
      index: true,
    },
    applicableTo: [{ type: String, enum: ["vessel", "resort", "both"] }],
    dataType: {
      type: String,
      enum: ["boolean", "number", "text", "select", "multi_select"],
      default: "boolean",
    },
    options: [String],
    filterable: { type: Boolean, default: true },
    visibleOnPage: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model("AttributeDefinitionV2", attributeDefinitionSchema);
