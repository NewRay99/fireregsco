interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
}

import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";

export default function Testimonial({ quote, author, role }: TestimonialProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-4 text-red-700">
        <ChatBubbleBottomCenterTextIcon className="w-8 h-8" />
      </div>
      <p className="text-gray-600 mb-4">{quote}</p>
      <div>
        <p className="font-bold">{author}</p>
        <p className="text-gray-500 text-sm">{role}</p>
      </div>
    </div>
  );
} 