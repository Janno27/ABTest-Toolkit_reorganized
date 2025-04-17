"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { ReachCategoryModal } from "./ReachCategoryModal";
import { ImpactKpiModal } from "./ImpactKpiModal";
import { ConfidenceSourceModal } from "./ConfidenceSourceModal";
import { EffortSizeModal } from "./EffortSizeModal";
import {
  ReachCategory,
  ImpactKPI,
  ConfidenceSource,
  EffortSize
} from "@/app/types/RiceServiceTypes";

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type: "text" | "number";
  min?: number;
  max?: number;
  step?: number;
}

function EditableCell({ value, onChange, type = "text", min, max, step }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const startEditing = () => {
    setTempValue(value);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(tempValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(type === "number" ? parseFloat(e.target.value) : e.target.value);
  };

  return (
    <div onClick={startEditing} className="cursor-pointer">
      {isEditing ? (
        <input
          type={type}
          value={tempValue}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          min={min}
          max={max}
          step={step}
          className="w-full bg-transparent focus:outline-none"
        />
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}

interface RiceSettingsTableProps {
  title: string;
  description: string;
  items: ReachCategory[] | ImpactKPI[] | ConfidenceSource[] | EffortSize[];
  onAdd: (item: any) => void;
  onEdit: (id: string, item: any) => void;
  onDelete: (id: string) => void;
  type: "reach" | "impact" | "confidence" | "effort";
}

export function RiceSettingsTable({
  title,
  description,
  items,
  onAdd,
  onEdit,
  onDelete,
  type
}: RiceSettingsTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const getColumns = () => {
    switch (type) {
      case "reach":
        return [
          { header: "Nom", key: "name", editable: false },
          { header: "Min (%)", key: "minReach", editable: false },
          { header: "Max (%)", key: "maxReach", editable: false },
          { header: "Points", key: "points", editable: true, type: "number", min: 0, max: 10, step: 0.1 },
          { header: "Exemple", key: "example", editable: false },
        ];
      case "impact":
        return [
          { header: "Nom", key: "name", editable: false },
          { header: "Min", key: "minDelta", editable: true, type: "text" },
          { header: "Max", key: "maxDelta", editable: true, type: "text" },
          { header: "Points/Unité", key: "pointsPerUnit", editable: true, type: "text" },
          { header: "Exemple", key: "example", editable: false },
        ];
      case "confidence":
        return [
          { header: "Nom", key: "name", editable: false },
          { header: "Points", key: "points", editable: true, type: "number", min: 0, max: 5, step: 0.1 },
          { header: "Exemple", key: "example", editable: false },
        ];
      case "effort":
        return [
          { header: "Nom", key: "name", editable: false },
          { header: "Durée", key: "duration", editable: true, type: "text" },
          { header: "Effort Dev", key: "devEffort", editable: true, type: "number", min: 0, max: 5, step: 0.1 },
          { header: "Effort Design", key: "designEffort", editable: true, type: "number", min: 0, max: 5, step: 0.1 },
          { header: "Exemple", key: "example", editable: false },
        ];
      default:
        return [];
    }
  };

  const columns = getColumns();

  const handleCellChange = (id: string, key: string, value: string | number) => {
    const item = items.find((item: any) => item.id === id);
    if (item) {
      const updatedItem = { ...item };
      const columnDef = columns.find(c => c.key === key);
      const columnType = (columnDef?.type || 'text') as 'number' | 'text';
      
      // Conversion explicite du type
      if (columnType === 'number') {
        (updatedItem as any)[key] = Number(value);
      } else {
        (updatedItem as any)[key] = String(value);
      }

      if (type === "impact") {
        const kpi = updatedItem as ImpactKPI;
        const midValue = kpi.minDelta.includes('%')
          ? `+${(parseFloat(kpi.minDelta.replace(/[^0-9.]/g, '')) + parseFloat(kpi.maxDelta.replace(/[^0-9.]/g, '')))/2}%`
          : `+${(parseFloat(kpi.minDelta.replace(/[^0-9.]/g, '')) + parseFloat(kpi.maxDelta.replace(/[^0-9.]/g, '')))/2}`;
        const pointValue = parseFloat(kpi.pointsPerUnit.split('/')[0]) * 2;
        updatedItem.example = `Δ ${midValue} → ${pointValue.toFixed(1)}`;
      }
      onEdit(id, updatedItem);
    }
  };

  const handleAdd = (newItem: any) => {
    onAdd(newItem);
    setIsAddModalOpen(false);
  };

  const handleEdit = (editedItem: any) => {
    if (currentItem) {
      onEdit(currentItem.id, { ...editedItem, id: currentItem.id });
      setIsEditModalOpen(false);
      setCurrentItem(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(id);
    }
  };

  const openEditModal = (item: any) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  const renderModal = () => {
    switch (type) {
      case "reach":
        return (
          <>
            <ReachCategoryModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <ReachCategoryModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              category={currentItem as ReachCategory}
            />
          </>
        );
      case "impact":
        return (
          <>
            <ImpactKpiModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <ImpactKpiModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              kpi={currentItem as ImpactKPI}
            />
          </>
        );
      case "confidence":
        return (
          <>
            <ConfidenceSourceModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <ConfidenceSourceModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              source={currentItem as ConfidenceSource}
            />
          </>
        );
      case "effort":
        return (
          <>
            <EffortSizeModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <EffortSizeModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              size={currentItem as EffortSize}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          size="sm"
          className="flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(column => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any) => (
            <TableRow key={item.id}>
              {columns.map(column => (
                <TableCell key={column.key}>
                  {column.editable ? (
                    <EditableCell
                      value={item[column.key]}
                      onChange={(value) => handleCellChange(item.id, column.key, value)}
                      type={(column.type as "text" | "number") || "text"}
                      min={column.min}
                      max={column.max}
                      step={column.step}
                    />
                  ) : (
                    item[column.key]
                  )}
                </TableCell>
              ))}
              <TableCell className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openEditModal(item)}
                  className="h-8 w-8"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  className="h-8 w-8 text-destructive"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {renderModal()}
    </div>
  );
}
