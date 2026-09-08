import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getActiveCompanyId } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

const RootPage = async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const companyId = await getActiveCompanyId();
  if (!companyId) {
    redirect("/companies");
  }

  redirect("/dashboard");
};

export default RootPage;
