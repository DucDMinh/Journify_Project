export const removeAccents = (str: string) =>
    str
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

export const stripProvincePrefix = (name: string) => name.replace(/Tỉnh |Thành phố |TP\. /gi, "").trim();
