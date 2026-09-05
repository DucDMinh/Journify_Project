
interface ListLocationsModalProps {
    onClose: () => void;
    setIsListModalOpen: (isOpen: boolean) => void;
}

export const ListLocationsModal: React.FC<ListLocationsModalProps> = ({
    setIsListModalOpen,
}) => {
    return (
        <>
            <div onClick={() => setIsListModalOpen(false)} className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/70 p-0 backdrop-blur-lg transition-all sm:p-4">

            </div>
        </>
    )
}