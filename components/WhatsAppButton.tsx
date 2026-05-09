import { MessageCircleMore } from "lucide-react";

import { Button } from "@/components/Button";
import { buildWhatsAppLink } from "@/lib/utils";

type WhatsAppButtonProps = {
  phone?: string | null;
  message?: string;
};

export function WhatsAppButton({ phone, message }: WhatsAppButtonProps) {
  const href = buildWhatsAppLink(phone, message);

  if (!href) {
    return (
      <Button type="button" variant="ghost" disabled>
        <MessageCircleMore className="h-4 w-4" />
        Message on WhatsApp
      </Button>
    );
  }

  return (
    <Button href={href} variant="ghost">
      <MessageCircleMore className="h-4 w-4" />
      Message on WhatsApp
    </Button>
  );
}
