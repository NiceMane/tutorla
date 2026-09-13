import { SkeletonList } from "@/components/ui/States";

export default function AppLoading() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-[clamp(14px,3vw,28px)] py-10">
      <SkeletonList count={4} height="h-28" />
    </main>
  );
}
