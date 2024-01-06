import { useParams } from "react-router-dom";
import * as apiClient from "../api-client";
import { useMutation, useQuery } from "react-query";
import ManageHotelForm from "../forms/ManageHotelForm/ManageHotelForm";
import { useAppContext } from "../contexts/AppContext";

const EditHotel = () => {
  const { hotelId } = useParams();
  const { showToast } = useAppContext();

  const { data: hotel } = useQuery(
    "fetchMyHotelById",
    () => apiClient.fetchMyHotelById(hotelId || ""),
    {
      // if hotelId does not have a value (undefined),
      // then useQuery will not run (enabled: false)
      enabled: !!hotelId,
    }
  );

  const { mutate, isLoading } = useMutation(apiClient.updateMyHotelById, {
    onSuccess: () => {
      showToast({ message: "Hotel Saved!", type: "SUCCESS" });
    },
    onError: () => {
      showToast({ message: "Error Saving Hotel", type: "ERROR" });
    },
  });

  const handleSave = (hotelFormData: FormData) => {
    mutate(hotelFormData);
  };

  return (
    <ManageHotelForm hotel={hotel} onSave={handleSave} isLoading={isLoading} />
  );
};

export default EditHotel;
