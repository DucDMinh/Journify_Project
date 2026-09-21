import { ok, created } from '../helpers/response.js';

export class BaseController {
    constructor(repository, itemName = 'Dữ liệu') {
        this.repository = repository;
        this.itemName = itemName;
    }

    async findOr404(id) {
        const record = await this.repository.getById(id);
        if (!record) {
            const error = new Error(`Không tìm thấy ${this.itemName}!`);
            error.status = 404;
            throw error;
        }
        return record;
    }

    getAll = async (ctx) => {
        ok(ctx, await this.repository.getAll());
    };

    getById = async (ctx) => {
        ok(ctx, await this.findOr404(ctx.params.id));
    };

    create = async (ctx) => {
        created(ctx, await this.repository.create(ctx.request.body), `Tạo mới ${this.itemName} thành công`);
    };

    update = async (ctx) => {
        await this.findOr404(ctx.params.id);
        ok(ctx, await this.repository.update(ctx.params.id, ctx.request.body), `Cập nhật ${this.itemName} thành công`);
    };

    delete = async (ctx) => {
        await this.findOr404(ctx.params.id);
        ok(ctx, await this.repository.delete(ctx.params.id), `Xóa ${this.itemName} thành công`);
    };
}
