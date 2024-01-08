import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Monitor Citizen Wallet Transactions",
  description: "Listen to new transactions on the blockchain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.jpg" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        {children}
        <footer className="bg-gray-100">
          <div className=" container text-white text-center p-4 mt-8 flex justify-between items-center">
            <div>
              <a href="https://citizenwallet.xyz">
                <div className="flex justify-center items-center">
                  <Image
                    src="/citizenwallet-logo-icon.svg"
                    alt="Citizen Wallet"
                    className="w-6 h-6 mr-2"
                    width={24}
                    height={24}
                  />
                  <Image
                    src="/citizenwallet-logo-text.svg"
                    alt="Citizen Wallet"
                    width={96}
                    height={24}
                    className="w-24 h-6 mr-2"
                  />
                </div>
              </a>
            </div>
            <div className="text-xs text-gray-700">
              <a
                href="https://github.com/citizenwallet/topup"
                className="text-gray-500"
              >
                github.com/citizenwallet/topup
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
