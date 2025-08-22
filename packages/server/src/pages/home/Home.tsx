import { Button } from "@/src/lib/components/ui/button";
import { useStorePersist } from "@/src/lib/hooks/use-store";
import { cn } from "@/src/lib/utils";
import { useApi } from "@/src/lib/hooks/use-api";
import Upload from "@/src/lib/components/custom/Upload";

export default function HomePage() {
    const api = useApi();
    const { mutate, status, error } = api.welcome;
    const { bears, setBears } = useStorePersist();

    return (
        <div
            className="h-full flex flex-col items-center justify-center"
        >
            <p className="text-7xl">Briefly.</p>
        </div>
    )
}