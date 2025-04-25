import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { Analytics } from "@vercel/analytics/react"
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
} from "@remix-run/react";
import stylesheet from "./tailwind.css";

import { useChangeLanguage } from "remix-i18next/react";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";

export const loader: LoaderFunction = async ({ request }) => {
  const locale = await i18next.getLocale(request);
  return json({ locale });
};

export const handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];
export const config = {
  maxDuration: 10,
};

export default function App() {
  const { locale } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();
  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script defer src="https://umami.way2free.eu.org/script.js" data-website-id="298a5bbd-1c3d-40ce-997c-ed2a992d522e"></script>
      </head>
      <body className="">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Analytics />
      </body>
    </html>
  );
}
