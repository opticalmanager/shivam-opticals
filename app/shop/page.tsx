import { redirect } from "next/navigation";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const queryString = new URLSearchParams(
    Object.entries(resolvedParams).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((item) => [k, item]) : v ? [[k, v]] : []
    )
  ).toString();

  redirect(`/products${queryString ? `?${queryString}` : ""}`);
}
