export class BaseController {
    constructor(repository, itemName = "Dữ liệu") {
        this.repository = repository;
        this.itemName = itemName;
    }

    getAll = async (ctx) => {
        try {
            const data = await this.repository.getAll();
            ctx.status = 200;
            ctx.body = { success: true, message: `Lấy danh sách ${this.itemName} thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi lấy danh sách ${this.itemName}`, error_detail: error.message };
        }
    }

    getById = async (ctx) => {
        try {
            const id = ctx.params.id;
            const data = await this.repository.getById(id);
            if (!data) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName}!` };
                return;
            }
            ctx.status = 200;
            ctx.body = { success: true, message: `Lấy thông tin ${this.itemName} thành công`, data };
        } catch (error) {
            ctx.status = 500;
            console.log(error);
            ctx.body = { success: false, message: `Lỗi hệ thống khi lấy ${this.itemName}`, error_detail: error.message };
        }
    }

    create = async (ctx) => {
        try {
            const payload = ctx.request.body;
            const data = await this.repository.create(payload);
            ctx.status = 201; // 201 Created
            ctx.body = { success: true, message: `Tạo mới ${this.itemName} thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi tạo ${this.itemName}`, error_detail: error.message };
        }
    }

    update = async (ctx) => {
        try {
            const id = ctx.params.id;
            const payload = ctx.request.body;
            const data = await this.repository.update(id, payload);
            if (!data) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để cập nhật!` };
                return;
            }
            ctx.status = 200;
            ctx.body = { success: true, message: `Cập nhật ${this.itemName} thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi cập nhật ${this.itemName}`, error_detail: error.message };
        }
    }

    delete = async (ctx) => {
        try {
            const id = ctx.params.id;
            const data = await this.repository.delete(id);
            if (!data) {
                ctx.status = 404;
                ctx.body = { success: false, message: `Không tìm thấy ${this.itemName} để xóa!` };
                return;
            }
            ctx.status = 200;
            ctx.body = { success: true, message: `Xóa ${this.itemName} thành công`, data };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { success: false, message: `Lỗi hệ thống khi xóa ${this.itemName}`, error_detail: error.message };
        }
    }
}