import { useGet } from "src/hooks/useGet";
import { EmailDto } from "src/domain/EmailDto";
import { useState } from "react";
import ChangeEmailModal from "./ChangeEmailModal";
import axios, { AxiosError } from "axios";
import { displayNetworkError } from "src/utils/errorToast";

export default function Settings() {
  const API_URL = process.env.REACT_APP_API_BASE_URL;

  let [refresh, setRefresh] = useState(false);

  function refreshEmail() {
    setRefresh(!refresh);
  }
  const emailResponse = useGet<EmailDto>(`${API_URL}/email`, refresh);

  const [email, setEmail] = useState("");

  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const openEmailModal = () => {
    setEmail(emailResponse.data?.email ?? "");
    setEmailModalOpen(true);
  };

  const changeEmailService = async () => {
    try {
      let url = `${API_URL}/email`;
      await axios.post(url, {
        email: email,
      });
      refreshEmail();
    } catch (error) {
      const axiosError = error as AxiosError;
      displayNetworkError(axiosError.message);
    }
  };

  return (
    <>
      <div className="m-2 mt-4">
        <div className="mt-2 flex justify-around">
          <div className="">
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-3"
            >
              E-mail:
            </label>
            <input
              id="email"
              name="email"
              type="text"
              value={emailResponse.data?.email ?? ""}
              className="mt-2 block pl-3 text-stone-600 rounded-md border-0 py-1.5  shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-neon sm:text-sm sm:leading-6"
              disabled
            />
          </div>

          <button
            className="bg-white text-red-600 py-4 rounded-xl px-2 border-2 border-red-600 ease-in-out duration-300 hover:shadow-xl"
            onClick={() => openEmailModal()}
          >
            Change e-mail
          </button>
        </div>
      </div>
      <ChangeEmailModal
        open={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
        }}
        email={email}
        updateEmail={(email: string) => setEmail(email)}
        onSave={() => changeEmailService()}
      />
    </>
  );
}
