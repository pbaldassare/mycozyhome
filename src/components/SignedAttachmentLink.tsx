import type { ReactNode } from "react";
import { useSignedUrl, type PrivateBucket } from "@/lib/storage";

/** Link a un file di un bucket privato, con URL firmato generato al momento. */
export function SignedAttachmentLink({
  bucket,
  value,
  className,
  children,
}: {
  bucket: PrivateBucket;
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { data: href } = useSignedUrl(bucket, value);
  return (
    <a
      href={href ?? undefined}
      aria-disabled={!href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
