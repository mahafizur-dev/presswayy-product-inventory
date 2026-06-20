"use client";

import { useState } from "react";
import type { ColumnType } from "./../types/inventory";
import { Button, TextField, SelectField, Modal } from "./ui";
import { useInventory } from "./../store/inventory";

const TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
];

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function AddColumnDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addColumn = useInventory((s) => s.addColumn);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const [options, setOptions] = useState("");
  const [error, setError] = useState("");

  function reset() {
    setLabel("");
    setType("text");
    setOptions("");
    setError("");
  }

  function submit() {
    const key = slugify(label);
    if (!key) {
      setError("Give the column a name.");
      return;
    }
    addColumn({
      key,
      label: label.trim(),
      type,
      ...(type === "select"
        ? { options: options.split(",").map((o) => o.trim()).filter(Boolean) }
        : {}),
    });
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add a column"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Add column
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Column name"
          value={label}
          error={error}
          placeholder="e.g. Supplier, Weight, Warranty"
          onChange={(e) => setLabel(e.target.value)}
          hint={label ? `Stored as “${slugify(label)}”` : "Shown as a new column for every product."}
        />
        <SelectField
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ColumnType)}
          options={TYPE_OPTIONS}
        />
        {type === "select" && (
          <TextField
            label="Options"
            value={options}
            placeholder="Small, Medium, Large"
            hint="Comma-separated choices."
            onChange={(e) => setOptions(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}
