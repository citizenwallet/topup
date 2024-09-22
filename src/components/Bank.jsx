"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { Separator } from "./ui/separator";

export default function Bank({ accountSlug, iban, accountName }) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderCopyButton = (text, field) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Card className="w-full max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle>Details</CardTitle>
        <CardDescription>
          Please transfer the exact amount you would like to top up for to the
          following account <b>with the reference {accountSlug}</b>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Account Name</p>
              <p className="text-sm text-gray-500 font-bold">{accountName}</p>
            </div>
            {renderCopyButton(accountName, "accountName")}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">IBAN</p>
              <p className="text-sm text-gray-500 font-bold">{iban}</p>
            </div>
            {renderCopyButton(iban, "iban")}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Reference</p>
              <p className="text-sm text-gray-500 font-bold">{accountSlug}</p>
            </div>
            {renderCopyButton(accountSlug, "message")}
          </div>
          <Separator />
          <p className="text-sm text-gray-500">
            Please note that bank transfers can take up to 24 hours to process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
