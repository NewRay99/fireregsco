"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  propertyType: z.string({
    required_error: "Please select a property type.",
  }),
  doorCount: z.string({
    required_error: "Please select the number of doors.",
  }),
  preferredDate: z.string().optional(),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

export default function ContactForm() {
  const [isDev, setIsDev] = useState(false);
  const [doorCountRanges, setDoorCountRanges] = useState<Array<{
    id: number;
    range_name: string;
    min_count: number;
    max_count: number | null;
    display_order: number;
  }>>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      propertyType: "",
      doorCount: "",
      preferredDate: "",
      message: "",
    },
  });

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    async function loadDoorCountRanges() {
      try {
        const { getDoorCountRanges } = await import('@/lib/supabase');
        const ranges = await getDoorCountRanges();
        setDoorCountRanges(ranges);
      } catch (error) {
        console.error("Error loading door count ranges:", error);
        setDoorCountRanges([
          { id: 1, range_name: "20-100", min_count: 20, max_count: 100, display_order: 1 },
          { id: 2, range_name: "100-200", min_count: 100, max_count: 200, display_order: 2 },
          { id: 3, range_name: "200-1000", min_count: 200, max_count: 1000, display_order: 3 },
          { id: 4, range_name: "1000-2000", min_count: 1000, max_count: 2000, display_order: 4 },
          { id: 5, range_name: "2000+", min_count: 2000, max_count: null, display_order: 5 }
        ]);
      }
    }
    
    loadDoorCountRanges();
  }, []);

  const fillWithTestData = () => {
    const names = ["John Smith", "Jane Doe", "Robert Johnson", "Emily Williams", "David Brown"];
    const propertyTypes = ["hmo", "hotel", "commercial", "public", "other"];
    const doorCounts = ["20-100", "100-200", "200-1000", "1000-2000", "2000+"];
    const messages = [
      "I need all fire doors in our building inspected as soon as possible.",
      "We're renovating our hotel and need all fire doors certified.",
      "Looking for a quote on fire door inspection for our office building.",
      "Need inspection for regulatory compliance by end of next month.",
      "Interested in a comprehensive fire safety assessment including all doors."
    ];

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const formattedDate = futureDate.toISOString().split('T')[0];

    form.reset({
      name: names[Math.floor(Math.random() * names.length)],
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`,
      propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      doorCount: doorCounts[Math.floor(Math.random() * doorCounts.length)],
      preferredDate: formattedDate,
      message: messages[Math.floor(Math.random() * messages.length)],
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fire Safety Inspection Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #c53030; border-bottom: 2px solid #c53030; padding-bottom: 10px; }
            h2 { color: #c53030; margin-top: 20px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; }
            .value { margin-bottom: 10px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>New Fire Safety Inspection Request</h1>
          
          <div class="section">
            <h2>Contact Information</h2>
            <p class="label">Name:</p>
            <p class="value">${values.name}</p>
            
            <p class="label">Email:</p>
            <p class="value">${values.email}</p>
            
            <p class="label">Phone:</p>
            <p class="value">${values.phone || "Not provided"}</p>
          </div>
          
          <div class="section">
            <h2>Property Details</h2>
            <p class="label">Property Type:</p>
            <p class="value">${values.propertyType}</p>
            
            <p class="label">Number of Doors for Inspection:</p>
            <p class="value">${values.doorCount}</p>

            <p class="label">Preferred Inspection Date:</p>
            <p class="value">${values.preferredDate || "No specific date requested"}</p>
          </div>
          
          <div class="section">
            <h2>Additional Information</h2>
            <p>${values.message}</p>
          </div>
          
          <div class="footer">
            <p>This request was submitted from the Fire Safety Services website on ${new Date().toLocaleString()}.</p>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'infofireregsco@gmail.com',
          subject: `Fire Door Inspection Request - ${values.name}`,
          html: emailHtml,
          formData: values
        }),
      });

      const emailResult = await emailResponse.json();
      
      if (!emailResponse.ok) {
        throw new Error(emailResult.message || 'Failed to send the email');
      }
      
      try {
        console.log('Submitting to Supabase sales table:', values);
        
        const supabaseResponse = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        
        console.log('Supabase API response status:', supabaseResponse.status);
        
        const supabaseResult = await supabaseResponse.json();
        
        console.log('Supabase API response body:', supabaseResult);
        
        if (!supabaseResponse.ok) {
          console.warn('Form submitted but failed to save to Supabase:', supabaseResult.error);
        } else {
          console.log('Form data saved to Supabase sales table successfully');
        }
      } catch (dbError) {
        console.error('Error saving to Supabase:', dbError);
      }
      
      toast({
        title: "Success!",
        description: "Thank you! We'll be in touch shortly.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name field - full width */}
            <div className="col-span-1 md:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email field - full width */}
            <div className="col-span-1 md:col-span-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Property Type and Door Count - grouped together */}
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hmo">HMO</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="public">Public Building</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doorCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Doors</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of doors" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doorCountRanges.map((range) => (
                        <SelectItem key={range.id} value={range.range_name}>
                          {range.range_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone and Preferred Date - grouped together */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Inspection Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message field - full width */}
            <div className="col-span-1 md:col-span-2">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your requirements"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit
            </Button>
            {isDev && (
              <Button
                type="button"
                variant="outline"
                onClick={fillWithTestData}
              >
                Fill Test Data
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
} 