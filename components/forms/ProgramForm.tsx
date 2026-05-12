"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { TimePickerField } from "@/components/forms/TimePickerField";
import { programSchema } from "@/lib/schemas";
import type { Program } from "@/lib/types";
import { slugify } from "@/lib/utils";

type FormValues = z.input<typeof programSchema>;
type RegistrationFieldValue = NonNullable<FormValues["registration_form"]>[number];

function createCustomField(): RegistrationFieldValue {
  return {
    id: crypto.randomUUID(),
    key: "",
    label: "",
    type: "text",
    placeholder: "",
    helper_text: "",
    required: false,
    options: [],
  };
}

function createSelectOption(existingOptions: string[] = []) {
  return `Option ${existingOptions.length + 1}`;
}

function buildDefaultValues(program?: Program | null): FormValues {
  return {
    id: program?.id,
    title: program?.title ?? "",
    slug: program?.slug ?? "",
    description: program?.description ?? "",
    flyer_url: program?.flyer_url ?? "",
    date: program?.date ?? "",
    time: program?.time ?? "",
    location: program?.location ?? "",
    online_link: program?.online_link ?? "",
    registration_deadline: program?.registration_deadline ?? "",
    registration_form:
      program?.registration_form?.map((field) => ({
        ...field,
        placeholder: field.placeholder ?? "",
        helper_text: field.helper_text ?? "",
        options: field.options ?? [],
      })) ?? [],
    status: program?.status ?? "draft",
  };
}

export function ProgramForm({ program }: { program?: Program | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error" | "warning">("success");
  const defaultValues = useMemo(() => buildDefaultValues(program), [program]);
  const form = useForm<FormValues>({
    resolver: zodResolver(programSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "registration_form",
  });
  const watchedFields = useWatch({
    control: form.control,
    name: "registration_form",
  });
  const watchedTime = useWatch({
    control: form.control,
    name: "time",
  });

  const customFieldCountLabel = useMemo(() => {
    if (!fields.length) {
      return "Only the PHOTIZO default registration fields are active right now.";
    }

    return `${fields.length} custom registration question${fields.length === 1 ? "" : "s"} configured.`;
  }, [fields.length]);

  function updateFieldOptions(index: number, updater: (options: string[]) => string[]) {
    const currentOptions = form.getValues(`registration_form.${index}.options`) || [];
    form.setValue(
      `registration_form.${index}.options`,
      updater([...currentOptions]),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  async function onSubmit(values: FormValues) {
    setMessage("");
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === "string") {
        formData.append(key, value);
      }
    });

    formData.append(
      "registration_form",
      JSON.stringify(values.registration_form || []),
    );

    const fileInput = document.getElementById("flyer_file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (file) {
      formData.append("flyer_file", file);
    }

    const response = await fetch(
      program?.id ? `/api/admin/programs/${program.id}` : "/api/admin/programs",
      {
        method: program?.id ? "PATCH" : "POST",
        body: formData,
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      setTone("error");
      setMessage(payload.error || "Unable to save program.");
      return;
    }

    if (payload.needsSchemaUpgrade) {
      setTone("warning");
      setMessage(
        "Program saved, but your custom registration questions are not being stored yet. Run supabase/program-form-upgrade.sql in Supabase, then save this form again.",
      );
      router.refresh();
      return;
    }

    setTone("success");
    setMessage(
      program?.id
        ? "Program updated successfully."
        : "Program created successfully.",
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft md:grid-cols-2 xl:grid-cols-3"
    >
      <div className="md:col-span-2 xl:col-span-3 rounded-[24px] border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/55 px-5 py-4 text-sm leading-7 text-[rgba(11,11,11,0.72)]">
        Published programs automatically receive a live registration page at
        <span className="mx-1 font-semibold text-[var(--dark-moss-green)]">
          /programs/your-program-slug
        </span>
        so visitors can click through and register immediately.
      </div>

      <FormInput
        label="Title"
        error={form.formState.errors.title?.message}
        {...form.register("title")}
      />
      <FormInput
        label="Slug"
        error={form.formState.errors.slug?.message}
        {...form.register("slug")}
      />
      <FormSelect
        label="Program status"
        error={form.formState.errors.status?.message}
        {...form.register("status")}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="closed">Closed</option>
        <option value="completed">Completed</option>
      </FormSelect>
      <div className="xl:col-span-3">
        <FormTextarea
          label="Description"
          error={form.formState.errors.description?.message}
          {...form.register("description")}
        />
      </div>
      <FormInput
        label="Date"
        type="date"
        error={form.formState.errors.date?.message}
        {...form.register("date")}
      />
      <TimePickerField
        label="Time"
        value={watchedTime}
        onChange={(value) =>
          form.setValue("time", value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        error={form.formState.errors.time?.message}
        helperText="Select a suggested time or type one in 12-hour format, for example 5:00 PM."
      />
      <FormInput
        label="Registration deadline"
        type="date"
        error={form.formState.errors.registration_deadline?.message}
        {...form.register("registration_deadline")}
      />
      <FormInput
        label="Location"
        placeholder="Upper Room Centre, Lagos"
        error={form.formState.errors.location?.message}
        {...form.register("location")}
      />
      <FormInput
        label="Online meeting link"
        placeholder="https://meet.google.com/photizo-room"
        error={form.formState.errors.online_link?.message}
        {...form.register("online_link")}
      />
      <FormInput
        label="Existing flyer URL"
        placeholder="https://example.com/photizo-flyer.jpg"
        error={form.formState.errors.flyer_url?.message}
        {...form.register("flyer_url")}
      />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--black)]">
          Upload flyer image
        </span>
        <input
          id="flyer_file"
          type="file"
          accept="image/*"
          className="min-h-12 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm"
        />
      </label>

      <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-[var(--cultured)]/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--dark-moss-green)]">
              <Sparkles className="h-4 w-4" />
              Registration Form Builder
            </div>
            <h3 className="mt-3 font-display text-3xl font-bold text-[var(--black)]">
              Customize each program registration form
            </h3>
            <p className="mt-3 text-sm leading-7 text-[rgba(11,11,11,0.68)]">
              The default registration already includes name, email, WhatsApp,
              country, city, referral source, and message. Add custom questions
              below when a specific program needs extra information.
            </p>
          </div>
          <div className="rounded-2xl border border-[rgba(72,108,38,0.1)] bg-white px-4 py-3 text-sm text-[rgba(11,11,11,0.7)]">
            {customFieldCountLabel}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {fields.map((field, index) => {
            const currentField = watchedFields?.[index];
            const errorBag = form.formState.errors.registration_form?.[index];
            const optionValues = currentField?.options || [];

            return (
              <div
                key={field.id}
                className="rounded-[24px] border border-[rgba(72,108,38,0.12)] bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-[rgba(72,108,38,0.7)]">
                      Custom Question {index + 1}
                    </div>
                    <div className="mt-1 font-medium text-[var(--black)]">
                      {currentField?.label || "Untitled registration field"}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormInput
                    label="Question label"
                    error={errorBag?.label?.message}
                    {...form.register(`registration_form.${index}.label`)}
                    onBlur={(event) => {
                      const nextKey = slugify(event.target.value);
                      const currentKey = form.getValues(
                        `registration_form.${index}.key`,
                      );

                      if (!currentKey && nextKey) {
                        form.setValue(
                          `registration_form.${index}.key`,
                          nextKey,
                          { shouldDirty: true, shouldValidate: true },
                        );
                      }
                    }}
                  />
                  <FormInput
                    label="Field key"
                    placeholder="arrival-time"
                    error={errorBag?.key?.message}
                    {...form.register(`registration_form.${index}.key`)}
                  />
                  <FormSelect
                    label="Field type"
                    error={errorBag?.type?.message}
                    {...form.register(`registration_form.${index}.type`)}
                  >
                    <option value="text">Text input</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone number</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select dropdown</option>
                  </FormSelect>
                  <FormInput
                    label="Placeholder"
                    error={errorBag?.placeholder?.message}
                    {...form.register(`registration_form.${index}.placeholder`)}
                  />
                  <FormInput
                    label="Helper text"
                    error={errorBag?.helper_text?.message}
                    {...form.register(`registration_form.${index}.helper_text`)}
                  />
                  <label className="flex items-center gap-3 rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm text-[var(--black)]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[rgba(72,108,38,0.22)]"
                      {...form.register(`registration_form.${index}.required`)}
                    />
                    Required field
                  </label>
                  {currentField?.type === "select" ? (
                    <div className="md:col-span-2 xl:col-span-3">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[var(--black)]">
                          Dropdown options
                        </div>
                        {optionValues.length ? (
                          optionValues.map((option, optionIndex) => (
                            <div
                              key={`${field.id}-option-${optionIndex}`}
                              className="flex items-center gap-3"
                            >
                              <input
                                value={option}
                                onChange={(event) =>
                                  updateFieldOptions(index, (options) => {
                                    options[optionIndex] = event.target.value;
                                    return options;
                                  })
                                }
                                className="min-h-12 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm text-[var(--black)] outline-none ring-0 placeholder:text-[rgba(11,11,11,0.35)] focus:border-[var(--gold)] focus:shadow-[0_0_0_4px_rgba(255,214,0,0.14)]"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateFieldOptions(index, (options) =>
                                    options.filter((_, itemIndex) => itemIndex !== optionIndex),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[rgba(11,11,11,0.55)]">
                            Add the first dropdown option below.
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateFieldOptions(index, (options) => [
                              ...options,
                              createSelectOption(options),
                            ])
                          }
                        >
                          <Plus className="h-4 w-4" />
                          Add Option
                        </Button>
                        {errorBag?.options?.message ? (
                          <span className="text-sm text-rose-600">
                            {errorBag.options.message as string}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => append(createCustomField())}
          >
            <Plus className="h-4 w-4" />
            Add Custom Question
          </Button>
        </div>
      </div>

      <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Saving..."
            : program?.id
              ? "Update Program"
              : "Create Program"}
        </Button>
        {message ? (
          <p
            className={`text-sm ${
              tone === "success"
                ? "text-[var(--dark-moss-green)]"
                : tone === "warning"
                  ? "text-amber-700"
                  : "text-rose-600"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
