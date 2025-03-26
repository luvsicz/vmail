import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <div className="text-white w-full mt-auto flex flex-col items-center justify-between px-5 pt-16 mb-10 md:px-10 mx-auto sm:flex-row">
      <Link to="/" className="text-xl font-black leading-none select-none logo">
        VMAIL.DEV
      </Link>
    </div>
  );
}
