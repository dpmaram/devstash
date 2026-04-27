import { cn } from "@/lib/utils";

export function getUserInitials(
  name: string | null | undefined,
  email?: string | null,
) {
  const nameParts = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (nameParts?.length) {
    return nameParts.map((part) => part[0]).join("").toUpperCase();
  }

  const emailInitial = email?.trim()[0];

  return emailInitial ? emailInitial.toUpperCase() : "?";
}

export function UserAvatar({
  className,
  email,
  imageUrl,
  name,
}: {
  className?: string;
  email?: string | null;
  imageUrl?: string | null;
  name?: string | null;
}) {
  const label = name ?? email ?? "User";

  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-sm font-semibold text-zinc-950",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${label} avatar`}
          className="size-full object-cover"
          src={imageUrl}
        />
      ) : (
        getUserInitials(name, email)
      )}
    </span>
  );
}
