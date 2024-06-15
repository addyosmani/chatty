"use client";

import { set, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TextareaAutosize from "react-textarea-autosize";
import React, { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import useMemoryStore from "@/hooks/useMemoryStore";
import { Switch } from "./ui/switch";

const formSchema = z.object({
  customInstructions: z.string().optional(),
  isCustomizedInstructionsEnabled: z.boolean().optional(),
});

interface EditCustomMemoryFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditCustomMemoryForm({
  setOpen,
}: EditCustomMemoryFormProps) {
  const customisedInstructions = useMemoryStore(
    (state) => state.customizedInstructions
  );
  const isCustomizedInstructionsEnabled = useMemoryStore(
    (state) => state.isCustomizedInstructionsEnabled
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customInstructions: customisedInstructions,
      isCustomizedInstructionsEnabled: isCustomizedInstructionsEnabled,
    },
  });

  const setCustomizedInstructions = useMemoryStore(
    (state) => state.setCustomizedInstructions
  );

  const setIsCustomizedInstructionsEnabled = useMemoryStore(
    (state) => state.setIsCustomizedInstructionsEnabled
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    setCustomizedInstructions(values.customInstructions || "");
    setIsCustomizedInstructionsEnabled(
      values.isCustomizedInstructionsEnabled || false
    );

    if (!values.customInstructions) {
      setIsCustomizedInstructionsEnabled(false);
    }
    setOpen(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    form.setValue("customInstructions", e.currentTarget.value, {
      shouldDirty: true,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="customInstructions"
          render={({ field }) => (
            <FormItem>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <FormControl>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2 items-center justify-between">
                        <FormLabel>Custom Memory</FormLabel>
                        <TooltipTrigger>
                          <InfoCircledIcon className="w-3.5 h-3.5 text-gray-500" />
                        </TooltipTrigger>
                      </div>
                      <FormDescription>
                        What would you like the AI to know about you to provide
                        better responses?
                      </FormDescription>
                      <TextareaAutosize
                        itemType="text"
                        className="w-full text-sm p-2 border border-gray-300 rounded-md resize-none min-h-40 max-h-40 bg-inherit"
                        defaultValue={customisedInstructions}
                        onChange={(e) => handleChange(e)}
                      />
                      <TooltipContent
                        sideOffset={15}
                        side="right"
                        className="hidden md:flex text-start"
                      >
                        <div className="text-sm">
                          <p className="font-medium">Starter thoughts:</p>
                          <p>- What is your name?</p>
                          <p>- What do you do for a living?</p>
                          <p>- What are your hobbies?</p>
                        </div>
                      </TooltipContent>
                    </div>
                  </FormControl>
                </Tooltip>
              </TooltipProvider>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isCustomizedInstructionsEnabled"
          render={({ field }) => (
            <FormItem>
              <FormControl className="w-full justify-between">
                <div className="sm:flex items-center space-y-4 sm:space-y-0">
                  <div className="flex gap-2">
                    <p className="text-sm">Enable for new chats</p>
                    <Switch
                      className=""
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  <div className="flex w-full sm:w-fit gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className="w-1/2 sm:w-fit"
                    >
                      Close
                    </Button>
                    <Button
                      // Disabled if form has not been changed
                      disabled={!form.formState.isDirty}
                      type="submit"
                      className="w-1/2 sm:w-fit"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
