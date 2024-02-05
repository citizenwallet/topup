"use client";

import { Button } from "@/components/ui/button";

const goback = () => {
  window.history.back();
};

const Error = ({ message }) => (
  <div className="p-4 mx-auto w-80 text-center">
    <h1 className="text-xl font-bold my-6">Error</h1>
    <p>{message}</p>
    <div className="flex justify-center mt-12">
      <Button onClick={goback}>Go back</Button>
    </div>
  </div>
);

export default Error;
