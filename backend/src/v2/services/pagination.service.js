const parsePagination = (query = {}, { defaultLimit = 25, maxLimit = 100, allowedSort = ['createdAt'], defaultSort = '-createdAt' } = {}) => {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit || String(defaultLimit), 10) || defaultLimit));

  const requestedSort = String(query.sort || defaultSort);
  const requestedField = requestedSort.replace(/^-/, '');
  const selectedSort = allowedSort.includes(requestedField) ? requestedSort : defaultSort;
  const descending = selectedSort.startsWith('-');
  const sortField = selectedSort.replace(/^-/, '');
  const sort = { [sortField]: descending ? -1 : 1, _id: descending ? -1 : 1 };

  return { page, limit, skip: (page - 1) * limit, sort };
};

const pagedResult = ({ items, total, page, limit }) => ({
  items,
  total,
  page,
  limit,
  pages: Math.max(1, Math.ceil(total / limit)),
  hasPrevious: page > 1,
  hasNext: page * limit < total,
});

module.exports = { parsePagination, pagedResult };
