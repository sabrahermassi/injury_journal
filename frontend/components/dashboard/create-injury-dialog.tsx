"use client";

import { useState } from "react";
import type { SubmitEventHandler } from "react";
import { InjuryBasicInfoForm } from "./injury-form/injury-basic-info-form";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { createInjury } from "@/services/api";

export function CreateInjuryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [bodyArea, setBodyArea] = useState("");
  const [side, setSide] = useState("");
  const [startDate, setStartDate] = useState("");
  const [cause, setCause] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setBodyArea("");
    setSide("");
    setStartDate("");
    setCause("");
    setDescription("");
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createInjury({
        name,
        bodyArea,
        side: side || null,
        startDate: new Date(startDate).toISOString(),
        cause: cause || null,
        description: description || null,
        status: "Active",
      });

      onCreated();
      resetForm();
      onOpenChange(false);
    } catch {
      setError("Could not create injury");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Injury</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InjuryBasicInfoForm
            name={name}
            setName={setName}
            bodyArea={bodyArea}
            setBodyArea={setBodyArea}
            side={side}
            setSide={setSide}
            startDate={startDate}
            setStartDate={setStartDate}
            cause={cause}
            setCause={setCause}
            description={description}
            setDescription={setDescription}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Injury"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
