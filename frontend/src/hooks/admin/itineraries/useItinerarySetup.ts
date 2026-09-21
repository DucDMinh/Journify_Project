/* eslint-disable @typescript-eslint/no-explicit-any */
import { Itinerary, Province, SetupScreenProp, Location } from "@/interface";
import { useEffect, useState } from "react";
import { toast } from 'sonner';

export const useItinerarySetup = (props: SetupScreenProp) => {
    const { selectedProvinces, setSelectedProvinces, setLocations, setStep, setCurrentItinerary, step } = props;

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchProvince, setSearchProvince] = useState("");
    const [provincesData, setProvincesData] = useState<Province[]>([]);
    const [templates, setTemplates] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchProvinces = async () => {
        try {
            const response = await fetch("http://localhost:8000/provinces");
            const result = await response.json();
            if (result.success && result.data) {
                setProvincesData(result.data);
            } else if (Array.isArray(result)) {
                setProvincesData(result);
            }
        } catch (error) {
            console.error("Error fetching provinces:", error);
            toast.error("Không thể tải danh sách tỉnh/thành phố.");
        }
    };

    const fetchItineraryData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:8000/itineraries`);
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                setTemplates(result.data);
            } else if (result.success && result.data && Array.isArray(result.data.data)) {
                setTemplates(result.data.data);
            } else if (Array.isArray(result)) {
                setTemplates(result);
            } else if (result.data && Array.isArray(result.data)) {
                setTemplates(result.data);
            } else {
                setTemplates([]);
            }
        } catch (error) {
            console.error("Error fetching itinerary data:", error);
            toast.error("Không thể tải dữ liệu lộ trình mẫu.");
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllSelectedLocations = async (provinceIds: string[]) => {
        if (provinceIds.length === 0) {
            setLocations([]);
            return;
        }
        try {
            const fetchPromises = provinceIds.map(id =>
                fetch(`http://localhost:8000/provinces/${id}`).then(res => res.json())
            );
            const results = await Promise.all(fetchPromises);
            let combinedLocations: Location[] = [];

            results.forEach(result => {
                if (result.data && result.data.locations) {
                    combinedLocations = [...combinedLocations, ...result.data.locations];
                }
            });
            setLocations(combinedLocations);
        } catch (error) {
            console.error("Error fetching locations:", error);
            toast.error("Không thể tải danh sách địa điểm.");
        }
    };

    useEffect(() => {
        if (step === "SETUP") {
            setTimeout(() => {
                fetchProvinces();
                fetchItineraryData();
            }, 0);
        }
    }, [step]);

    const handleSelectProvince = (province: { id: string, name: string, image_url: string | "" }) => {
        if (!selectedProvinces.find(p => p.id === province.id)) {
            setSelectedProvinces([...selectedProvinces, province]);
        }
        setSearchProvince("");
        setIsDropdownOpen(false);
    };

    const handleRemoveProvince = (id: string) => {
        setSelectedProvinces(selectedProvinces.filter(p => p.id !== id));
    };

    const handleCreateItinerary = () => {
        setStep("BUILDER");
        const idsToFetch = selectedProvinces.map(p => p.id);
        fetchAllSelectedLocations(idsToFetch);
    };

    // 🌟 Tách logic xử lý chọn Template dài loằng ngoằng thành hàm gọn gàng
    const handleSelectTemplate = async (tpl: Itinerary) => {
        const toastId = toast.loading("Đang tải dữ liệu lộ trình...");
        try {
            const response = await fetch(`http://localhost:8000/itineraries/${tpl.id}`);
            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data.data;
                setCurrentItinerary({
                    id: data.id,
                    title: data.title || "",
                    theme: data.theme || "",
                    summary: data.summary || "",
                    start_date: data.start_date || "",
                    end_date: data.end_date || "",
                    image_url: data.image_url || "",
                    itinerary_days: data.itinerary_days || []
                });

                let idsToFetch: string[] = [];
                if (data.itinerary_provinces && data.itinerary_provinces.length > 0) {

                    const provincesList = data.itinerary_provinces.map((item: any) => {
                        const prov = item.provinces || item;
                        return {
                            id: prov.id || prov.province_id,
                            name: prov.name || "",
                            image_url: prov.image_url ?? ""
                        };
                    });
                    setSelectedProvinces(provincesList);
                    idsToFetch = provincesList.map((p: any) => p.id);
                } else {
                    setSelectedProvinces([]);
                    idsToFetch = [];
                }

                fetchAllSelectedLocations(idsToFetch);
                toast.success("Tải dữ liệu thành công!", { id: toastId });
                setStep("BUILDER");
            } else {
                toast.error("Không tìm thấy dữ liệu chi tiết.", { id: toastId });
            }
        } catch (error) {
            console.error("Lỗi khi tải chi tiết lộ trình:", error);
            toast.error("Lỗi kết nối máy chủ.", { id: toastId });
        }
    };

    const filteredProvinces = provincesData?.filter(province =>
        province.name.toLowerCase().includes(searchProvince.toLowerCase()) &&
        !selectedProvinces.some(selected => selected.id === province.id)
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
        handleSelectTemplate, fetchProvinces,
        fetchAllSelectedLocations
    };
};