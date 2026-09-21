import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { supabase } from "@/utils/supabaseClient";
import { EMPTY_LOCATION_FORM, Location, LocationFormData, Province } from "@/interface";
import {
    base64ToFile,
    cleanMapLink,
    extractCoordsFromMapsUrl,
    extractPlaceNameFromMapsUrl,
    matchProvince,
    matchProvinceFromPlaceName,
} from "@/utils/googleMaps";

interface MapExtractResult {
    expandedUrl: string;
    name: string;
    base64: string | null;
    fileName?: string;
    mimeType?: string;
}

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;
const PROVINCES_CACHE_KEY = "provinces_cache";

const readProvinceCache = (): Province[] | null => {
    try {
        const cached = sessionStorage.getItem(PROVINCES_CACHE_KEY);
        return cached ? (JSON.parse(cached) as Province[]) : null;
    } catch {
        return null;
    }
};

const buildLocationForm = (form: LocationFormData, imageFile: File | null) => {
    const submitData = new FormData();
    submitData.append("name", form.name);
    (["description", "note", "lat", "lng", "province_id", "difficulty_level"] as const).forEach((key) => {
        if (form[key]) submitData.append(key, form[key]);
    });
    if (imageFile) submitData.append("image", imageFile);
    return submitData;
};

export const useLocationsAdmin = (initialSearch: string) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [provinces, setProvinces] = useState<Province[]>(() => readProvinceCache() ?? []);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [mapLink, setMapLink] = useState("");
    const [pickLocation, setPickLocation] = useState<Location>();
    const [filterProvince, setFilterProvince] = useState("");
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState<LocationFormData>(EMPTY_LOCATION_FORM);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const fetchProvinces = useCallback(
        () =>
            api.get<Province[]>("/provinces").then(({ response, data }) => {
                if (!response.ok) return;
                const list = data.data ?? [];
                setProvinces(list);
                try {
                    sessionStorage.setItem(PROVINCES_CACHE_KEY, JSON.stringify(list));
                } catch {
                    // sessionStorage có thể bị chặn (private mode); bỏ qua cache
                }
            }),
        [],
    );

    const fetchLocations = useCallback(() => {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
        if (searchQuery) params.set("search", searchQuery);
        if (filterProvince) params.set("province_id", filterProvince);
        return api
            .get<Location[]>(`/locations?${params}`)
            .then(({ response, data }) => {
                if (!response.ok) throw new Error(data.message);
                setLocations(data.data ?? []);
                setTotalPages(Number(data.totalPages) || 1);
            })
            .catch(() => toast.error("Không thể tải danh sách địa điểm!"))
            .finally(() => setIsLoading(false));
    }, [currentPage, searchQuery, filterProvince]);

    useEffect(() => {
        if (!readProvinceCache()) fetchProvinces();
        const channel = supabase
            .channel("admin-provinces")
            .on("postgres_changes", { event: "*", schema: "public", table: "provinces" }, () => fetchProvinces())
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchProvinces]);

    useEffect(() => {
        const debounce = setTimeout(fetchLocations, SEARCH_DEBOUNCE_MS);
        const channel = supabase
            .channel("admin-locations")
            .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, () => fetchLocations())
            .subscribe();
        return () => {
            clearTimeout(debounce);
            supabase.removeChannel(channel);
        };
    }, [fetchLocations]);

    const resetForm = () => {
        setFormData(EMPTY_LOCATION_FORM);
        setImageFile(null);
        setMapLink("");
        setPickLocation(undefined);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setIsLoading(true);
        setFilterProvince(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsLoading(true);
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const goToPage = (updater: (page: number) => number) => {
        setIsLoading(true);
        setCurrentPage(updater);
    };

    const resolveProvinceId = async (placeName: string, coords: { lat: string; lng: string }) => {
        const byName = placeName ? matchProvinceFromPlaceName(placeName, provinces) : undefined;
        if (byName) return byName.id;
        try {
            const { response, data } = await api.get<{ provinceName: string }>(
                `/map/province-from-coords?lat=${coords.lat}&lng=${coords.lng}`,
            );
            if (!response.ok || !data.data?.provinceName) return "";
            return matchProvince(data.data.provinceName, provinces)?.id ?? "";
        } catch {
            return "";
        }
    };

    const handleExtractFromLink = async () => {
        if (!mapLink) {
            toast.error("Vui lòng nhập link Google Maps!");
            return;
        }
        const cleanLink = cleanMapLink(mapLink);
        const toastId = toast.loading("Đang trích xuất dữ liệu không gian...");

        try {
            const { response, data } = await api.get<MapExtractResult>(`/map/extract?url=${encodeURIComponent(cleanLink)}`);
            if (!response.ok || !data.data) throw new Error(data.message || "API lỗi");
            const result = data.data;
            const finalUrl = result.expandedUrl || cleanLink;
            const coords = extractCoordsFromMapsUrl(finalUrl);
            if (!coords) {
                toast.error("Không tìm thấy tọa độ trong link này.", { id: toastId });
                return;
            }
            const extractedName = result.name || extractPlaceNameFromMapsUrl(finalUrl);
            const provinceId = await resolveProvinceId(extractedName, coords);

            setFormData((prev) => ({
                ...prev,
                ...coords,
                ...(extractedName ? { name: extractedName } : {}),
                ...(provinceId ? { province_id: provinceId } : {}),
            }));
            if (result.base64) {
                setImageFile(base64ToFile(result.base64, result.fileName ?? "google-map-preview.jpg", result.mimeType ?? "image/jpeg"));
                toast.success("Trích xuất dữ liệu hoàn tất!", { id: toastId });
            } else {
                toast.success("Đã lấy dữ liệu (Không có ảnh xem trước)!", { id: toastId });
            }
        } catch {
            const coords = extractCoordsFromMapsUrl(cleanLink);
            if (coords) {
                setFormData((prev) => ({ ...prev, ...coords }));
                toast.success("Đã lấy được tọa độ dự phòng!", { id: toastId });
            } else {
                toast.error("Không thể trích xuất dữ liệu từ link này.", { id: toastId });
            }
        }
    };

    const submitLocation = async (mode: "add" | "edit", e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "edit" && !pickLocation) {
            toast.error("Không tìm thấy dữ liệu địa điểm cần sửa!");
            return;
        }
        setIsSaving(true);
        const toastId = toast.loading(mode === "add" ? "Đang thiết lập tọa độ lên hệ thống..." : "Đang cập nhật địa điểm...");
        try {
            const body = buildLocationForm(formData, imageFile);
            const { response, data } =
                mode === "add"
                    ? await api.post("/locations", body)
                    : await api.patch(`/locations/${pickLocation!.id}`, body);
            if (!response.ok) throw new Error(data.message || "Lưu thất bại");
            toast.success(mode === "add" ? "Khởi tạo không gian thành công!" : "Cập nhật tọa độ thành công!", { id: toastId });
            if (mode === "add") setIsAddModalOpen(false);
            else setIsEditModalOpen(false);
            resetForm();
            fetchLocations();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lưu thất bại!", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSubmit = (e: React.FormEvent) => submitLocation("add", e);
    const handleEditSubmit = (e: React.FormEvent) => submitLocation("edit", e);

    const executeDelete = async (id: string, name: string) => {
        const toastId = toast.loading(`Đang xóa "${name}"...`);
        try {
            const { response, data } = await api.delete(`/locations/${id}`);
            if (!response.ok) throw new Error(data.message || "Lỗi khi xóa địa điểm");
            toast.success(`Đã xóa "${name}" thành công!`, { id: toastId });
            fetchLocations();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xóa thất bại!", { id: toastId });
        }
    };

    return {
        locations, provinces, isLoading, isSaving,
        mapLink, setMapLink,
        pickLocation, setPickLocation,
        filterProvince, searchQuery, currentPage, goToPage, totalPages,
        isAddModalOpen, setIsAddModalOpen,
        isEditModalOpen, setIsEditModalOpen,
        formData, setFormData,
        imageFile, setImageFile,
        handleInputChange, handleFilterChange, handleSearchChange,
        handleExtractFromLink, handleAddSubmit, handleEditSubmit, executeDelete,
    };
};
