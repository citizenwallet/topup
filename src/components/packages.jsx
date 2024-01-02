"use client";
/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/pYvLECH4ojt
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Packages({ accountAddress, packages }) {
  const [formattedPackages, setFormattedPackages] = useState([]);

  useEffect(() => {
    const newPackages = packages.map((pkg) => {
      const formattedAmount = formatCurrency(
        pkg.amount,
        pkg.currency,
        navigator.language
      );
      const fees = formatCurrency(
        0.25 + 0.015 * pkg.amount,
        pkg.currency,
        navigator.language
      );
      pkg.buyUrl += `?accountAddress=${accountAddress}`;
      return { ...pkg, formattedAmount, fees };
    });
    setFormattedPackages(newPackages);
  }, [packages, accountAddress]);

  function formatCurrency(amount, currency, locale) {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }
  // console.log(
  //   ">>> rendering packages for accountAddress",
  //   accountAddress,
  //   formattedPackages
  // );
  return (
    <main className="flex flex-col items-center p-4">
      {formattedPackages.map((pkg, i) => (
        <Card className="w-full max-w-md mb-6" key={`package-${i}`}>
          <CardHeader>
            <CardTitle>Buy {pkg.amount} Zinnes</CardTitle>
            <div className="text-sm text-gray-500">1 Zinne = 1 Euro</div>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="text-xl font-semibold">{pkg.formattedAmount}</div>
            <div className="text-sm text-gray-500">
              +{pkg.fees} (Stripe fees)
            </div>
          </CardContent>
          <CardFooter>
            <Link
              className="border border-gray-300 rounded-md p-3 dark:border-gray-600 block text-center py-2"
              href={pkg.buyUrl}
            >
              Buy Now
            </Link>
          </CardFooter>
        </Card>
      ))}
    </main>
  );
}
