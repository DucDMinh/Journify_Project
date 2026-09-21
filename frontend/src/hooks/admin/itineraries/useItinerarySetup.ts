import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Itinerary, Province, SetupScreenProp, Location } from "@/interface";
import { api } from "@/lib/apiClient";

const toProvince = (item: { provinces?: Province | null; province_id?: string }): Province | null => {
    const prov = item.provinces;
    if (!prov?.id) return null;
    return { id: prov.id, name: prov.name ?? "", image_url: prov.image_url ?? "" };
};

export const useItinerarySetup = (props: SetupScreenProp) => {
    const { selectedProvinces, setSelectedProvinces, setLocations, setStep, setCurrentItinerary, step } = props;

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchProvince, setSearchProvince] = useState("");
    const [provincesData, setProvincesData] = useState<Province[]>([]);
    const [templates, setTemplates] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(step === "SETUP");

    const fetchProvinces = useCallback(
        () =>
            api.get<Province[]>("/provinces").then(({ response, data }) => {
                if (!response.ok) throw new Error(data.message);
                setProvincesData(data.data ?? []);
            }).catch(() => toast.error("Không thể tải danh sách tỉnh/thành phố.")),
        [],
    );

    const fetchItineraryData = useCallback(
        () =>
            api.get<Itinerary[]>("/itineraries").then(({ response, data }) => {
                if (!response.ok) throw new Error(data.message);
                setTemplates(data.data ?? []);
            }).catch(() => {
                toast.error("Không thể tải dữ liệu lộ trình mẫu.");
                setTemplates([]);
            }).finally(() => setIsLoading(false)),
        [],
    );

    const fetchAllSelectedLocations = async (provinceIds: string[]) => {
        if (provinceIds.length === 0) {
            setLocations([]);
            return;
        }
        try {
            const results = await Promise.all(provinceIds.map((id) => api.get<Province & { locations?: Location[] }>(`/provinces/${id}`)));
            setLocations(results.flatMap((r) => (r.response.ok ? r.data.data?.locations ?? [] : [])));
        } catch {
            toast.error("Không thể tải danh sách địa điểm.");
        }
    };

    useEffect(() => {
        if (step !== "SETUP") return;
        fetchProvinces();
        fetchItineraryData();
    }, [step, fetchProvinces, fetchItineraryData]);

    const handleSelectProvince = (province: Province) => {
        if (!selectedProvinces.some((p) => p.id === province.id)) {
            setSelectedProvinces([...selectedProvinces, province]);
        }
        setSearchProvince("");
        setIsDropdownOpen(false);
    };

    const handleRemoveProvince = (id: string) => {
        setSelectedProvinces(selectedProvinces.filter((p) => p.id !== id));
    };

    const handleCreateItinerary = () => {
        setStep("BUILDER");
        fetchAllSelectedLocations(selectedProvinces.map((p) => p.id));
    };

    const handleSelectTemplate = async (tpl: Itinerary) => {
        const toastId = toast.loading("Đang tải dữ liệu lộ trình...");
        try {
            const { response, data } = await api.get<Itinerary>(`/itineraries/${tpl.id}`);
            if (!response.ok || !data.data) {
                toast.error(data.message || "Không tìm thấy dữ liệu chi tiết.", { id: toastId });
                return;
            }
            const itinerary = data.data;
            setCurrentItinerary({
                id: itinerary.id,
                title: itinerary.title ?? "",
                theme: itinerary.theme ?? "",
                summary: itinerary.summary ?? "",
                start_date: itinerary.start_date ?? "",
                end_date: itinerary.end_date ?? "",
                image_url: itinerary.image_url ?? "",
                share: itinerary.share ?? false,
                itinerary_days: itinerary.itinerary_days ?? [],
            });
            const provinces = (itinerary.itinerary_provinces ?? []).map(toProvince).filter((p): p is Province => p !== null);
            setSelectedProvinces(provinces);
            fetchAllSelectedLocations(provinces.map((p) => p.id));
            toast.success("Tải dữ liệu thành công!", { id: toastId });
            setStep("BUILDER");
        } catch {
            toast.error("Lỗi kết nối máy chủ.", { id: toastId });
        }
    };

    const filteredProvinces = provincesData.filter(
        (province) =>
            province.name.toLowerCase().includes(searchProvince.toLowerCase()) &&
            !selectedProvinces.some((selected) => selected.id === province.id),
    );

    return {
        isDropdownOpen, setIsDropdownOpen,
        searchProvince, setSearchProvince,
        templates,
        isLoading,
        filteredProvinces,
        handleSelectProvince,
        handleRemoveProvince,
        handleCreateItinerary,
        handleSelectTemplate,
        fetchProvinces,
        fetchAllSelectedLocations,
    };
};
