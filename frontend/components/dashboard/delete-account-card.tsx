"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deleteAccount } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The design's "Delete everything" row, wired to DELETE /api/auth/me.
 *
 * The confirmation asks the user to type their own email rather than pressing
 * a second button. This removes every symptom, treatment, visit and note in
 * the account in one transaction with no undo and no export first — a
 * mis-click should not be able to reach it.
 */
export function DeleteAccountCard({ email }: { email: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  const canDelete =
    !!email && confirmation.trim().toLowerCase() === email.toLowerCase();

  async function handleDelete() {
    if (!canDelete) return;

    setDeleting(true);
    setError(false);

    try {
      await deleteAccount();
      // replace(), not push(): there is no account to go back to.
      router.replace("/login");
    } catch (err) {
      console.error(err);
      setError(true);
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex max-w-xl flex-wrap items-center gap-4 rounded-[22px] bg-card p-5.5 ring-1 ring-border">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[19px] leading-tight font-medium text-foreground">
            Delete everything
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Removes every injury, symptom, treatment and visit in this account.
            This cannot be undone, and there is no export first.
          </p>
        </div>

        <Button
          variant="outline"
          className="h-11 flex-none rounded-full px-5 text-destructive hover:text-destructive"
          onClick={() => {
            setConfirmation("");
            setError(false);
            setOpen(true);
          }}
        >
          Delete account
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              Everything logged under {email ?? "this account"} is deleted
              permanently. Nobody can restore it, including us.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Type <span className="font-medium text-foreground">{email}</span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-email"
              value={confirmation}
              onChange={(event) => setConfirmation(event.currentTarget.value)}
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              Couldn&apos;t delete the account - nothing was removed. Try again.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep my account
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
