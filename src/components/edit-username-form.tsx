"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { toast } from "sonner";
import useChatStore from "@/hooks/useChatStore";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

interface EditUsernameFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditUsernameForm({ setOpen }: EditUsernameFormProps) {
  const [name, setName] = useState("");
  const userName = useChatStore((state) => state.userName);
  const setUserName = useChatStore((state) => state.setUserName);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: userName,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setUserName(values.username);
    toast.success("Name updated successfully");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    form.setValue("username", e.currentTarget.value);
    setName(e.currentTarget.value);
  };

  return (
    <Form {...form}>
      <div className="w-full flex flex-col gap-4">
        <FormLabel>Theme</FormLabel>
        <ModeToggle />
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="md:flex md:gap-4 space-y-4 md:space-y-0">
                  <Input
                    {...field}
                    type="text"
                    onChange={(e) => handleChange(e)}
                  />
                  <Button type="submit" className="w-full md:w-fit">
                    Change name
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
