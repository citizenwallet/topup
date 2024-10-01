"use client";
/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/pYvLECH4ojt
 */

import React, { useEffect, useState } from "react";

import {
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useFaucet from "@/hooks/use-faucet";
function hasFees(pluginConfig, pkg) {
  if (pkg.stripe) {
    if (pkg.stripe.prices.fees) {
      return true;
    }
  } else if (pluginConfig.stripe && pluginConfig.stripe.prices.fees) {
    return true;
  }
  return false;
}

export function Packages({
  communitySlug,
  pluginConfig,
  accountAddress,
  redirectUrl,
}) {
  const { faucet, isLoading, isError } = useFaucet(communitySlug);
  const [formattedPackages, setFormattedPackages] = useState([]);
  const [isItemLoading, setIsItemLoading] = useState(null);
  const router = useRouter();
  const faucetBalance = faucet && parseInt(faucet.balance);
  useEffect(() => {
    const newPackages = pluginConfig.packages
      .filter((pkg) => !pkg.hidden)
      .map((pkg) => {
        pkg.key = `${pkg.amount}-${pkg.buyUrl}`;
        if (pkg.currency) {
          pkg.formattedAmount = formatCurrency(
            (pkg.unitprice_in_cents * pkg.amount) / 100,
            pkg.currency,
            navigator.language
          );
          if (hasFees(pluginConfig, pkg)) {
            pkg.fees = formatCurrency(
              pkg.fees_in_cents,
              pkg.currency,
              navigator.language
            );
          }
        }
        pkg.buyUrl = `/${communitySlug}/topup/${
          (pkg.unitprice_in_cents > 0 ? pkg.unitprice_in_cents : 1) * pkg.amount
        }`;
        return pkg;
      });
    setFormattedPackages(newPackages);
  }, [pluginConfig, communitySlug]);

  function formatCurrency(amount, currency, locale) {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }

  function pkgState(pkg) {
    if (pluginConfig.mode === "mint") {
      return pkg.formattedAmount;
    }
    if (isLoading) return "loading";
    return pkg.amount > faucetBalance
      ? "sold out"
      : pkg.unitprice_in_cents
      ? pkg.formattedAmount
      : "free";
  }

  const handleClick = (href, itemId) => {
    setIsItemLoading(itemId);
    let goto = href;
    if (accountAddress) {
      goto += `?accountAddress=${accountAddress}&redirectUrl=${encodeURIComponent(
        redirectUrl
      )}`;

      router.push(goto);
    } else {
      const localAccountAddress = window.localStorage.getItem("accountAddress");
      const localRedirectUrl = window.localStorage.getItem("redirectUrl");
      if (localAccountAddress && localRedirectUrl) {
        goto += `?accountAddress=${localAccountAddress}&redirectUrl=${encodeURIComponent(
          localRedirectUrl
        )}`;

        // cleanup
        window.localStorage.removeItem("accountAddress");
        window.localStorage.removeItem("redirectUrl");
        router.push(goto);
      } else {
        console.error("No account address found");
      }
    }
    return false;
  };

  const loading = isLoading && pluginConfig.mode !== "mint";

  return (
    <main className="flex flex-wrap items-center p-4 max-w-96 mx-auto justify-center">
      {formattedPackages.map((pkg) => (
        <a
          key={pkg.key}
          className={`relative w-full max-w-36 h-20 bg-grey-25 rounded-xl flex flex-col justify-center cursor-pointer ${
            (loading && "opacity-35") ||
            (isItemLoading && isItemLoading !== pkg.key && "opacity-35")
          } active:contrast-[0.9] my-2 mx-2 ${
            isItemLoading === pkg.key && "packageButtonLoading"
          }`}
          onClick={() =>
            !loading && !isItemLoading && handleClick(pkg.buyUrl, pkg.key)
          }
        >
          <div className="text-purple-primary flex flex-row items-center mx-auto">
            <h2 className="font-bold text-2xl mr-1">{pkg.amount / 100}</h2>
            <div className="text-sm">{pkg.unit}</div>
          </div>
          <div className="flex justify-center items-center">
            <div className="text-lg text-grey-350">{pkgState(pkg)}</div>
          </div>
        </a>
      ))}
    </main>
  );
}
