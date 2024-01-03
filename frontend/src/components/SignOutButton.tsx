import { useMutation, useQueryClient } from "react-query";
import { useAppContext } from "../contexts/AppContext";
import * as apiClient from "../api-client";

const SignOutButton = () => {
  const quertClient = useQueryClient();
  const { showToast } = useAppContext();

  const mutation = useMutation(apiClient.signOut, {
    onSuccess: async () => {
      // validateToken comes from useQuery
      // this is going to foce the validate token function to run again
      // it'll notice that the token is invalid
      // and the isError on AppContext.tsx will be true ==> isLoggedIn: false
      await quertClient.invalidateQueries("validateToken");
      showToast({ message: "Sign out Successful!", type: "SUCCESS" });
    },
    onError: async (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });
  const handleClick = () => {
    mutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 px-3 font-bold bg-white hover:bg-gray-100"
    >
      Sign Out
    </button>
  );
};

export default SignOutButton;
