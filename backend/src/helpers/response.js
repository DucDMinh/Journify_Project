export const ok = (ctx, data, message, status = 200, extra = {}) => {
    ctx.status = status;
    ctx.body = { success: true, ...(message ? { message } : {}), data, ...extra };
};

export const created = (ctx, data, message) => ok(ctx, data, message, 201);
