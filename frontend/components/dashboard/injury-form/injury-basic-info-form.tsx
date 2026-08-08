"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InjuryBasicInfoForm({
  name,
  setName,
  bodyArea,
  setBodyArea,
  side,
  setSide,
  startDate,
  setStartDate,
  cause,
  setCause,
  description,
  setDescription,
}: {
  name: string;
  setName: (value: string) => void;
  bodyArea: string;
  setBodyArea: (value: string) => void;
  side: string;
  setSide: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  cause: string;
  setCause: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
}) {
  return (
    <>
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

        <Input
          id="description"
          placeholder="Started after heavy lifting"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </>
  );
}
