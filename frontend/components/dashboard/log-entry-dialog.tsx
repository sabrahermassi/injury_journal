"use client";

import { useState } from "react";
import type { SubmitEventHandler } from "react";

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

export function LogEntryDialog({
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

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createInjury({
        name,
        bodyArea,
        side,
        startDate: new Date(startDate).toISOString(),
        cause,
        description,
        status: "Active",
      });

      onCreated();
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
          <div className="space-y-2">
            <Label htmlFor="name">Injury name</Label>

            <Input
              id="name"
              placeholder="Lower back pain and pelvis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyArea">Body area</Label>

            <Input
              id="bodyArea"
              placeholder="Lower back and pelvis"
              value={bodyArea}
              onChange={(e) => setBodyArea(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="side">Side</Label>

            <Input
              id="side"
              placeholder="Left"
              value={side}
              onChange={(e) => setSide(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>

            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cause">Cause</Label>

            <Input
              id="cause"
              placeholder="Deadlift"
              value={cause}
              onChange={(e) => setCause(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>

            <Textarea
              id="description"
              placeholder="Started after heavy lifting"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Injury"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
