import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ContactForm from "@/components/ContactForm";
import Testimonial from "@/components/Testimonial";
import DoorCounter from "@/components/DoorCounter";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const fetchDataFromSupabase = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('your_table')
      .select('*');
      
    if (error) {
      console.error('Error fetching data:', error);
      return [];
    }
    
    return data;
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-red-700 text-white pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Fire Safety Compliance Specialists</h1>
            <p className="text-xl md:text-2xl mb-8">
              Professional fire door inspections and safety assessments for HMOs, hotels, and commercial properties
            </p>
            
            {/* Door Counter */}
            <div className="max-w-xs mx-auto mb-8">
              <DoorCounter />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="#contact" 
                className="bg-white text-red-700 font-bold py-3 px-6 rounded-md hover:bg-gray-100 transition-colors"
              >
                Get a Free Quote
              </Link>
              <Link 
                href="#services" 
                className="border-2 border-white text-white font-bold py-3 px-6 rounded-md hover:bg-red-800 transition-colors"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Certified & Accredited</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center">
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-bafe.png" 
                alt="BAFE Certification" 
                width={150} 
                height={75} 
                className="object-contain h-16 md:h-20"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-cpd.png" 
                alt="CPD Certification" 
                width={150} 
                height={75} 
                className="object-contain h-16 md:h-20"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-dsear.png" 
                alt="DSEAR Certification" 
                width={150} 
                height={75} 
                className="object-contain h-16 md:h-20"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-myfire.png" 
                alt="MyFire Certification" 
                width={150} 
                height={75} 
                className="object-contain h-16 md:h-20"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-riskfire.png" 
                alt="RiskFire Certification" 
                width={150} 
                height={75} 
                className="object-contain h-16 md:h-20"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-rospa.png" 
                alt="ROSPA Certification" 
                width={150} 
                height={75} 
                className="object-contain h-16 md:h-20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="text-center">
              <p className="text-lg font-semibold">Certified Inspector</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">RRO 2005 Compliant</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">BS9999 Standards</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Professional Reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Fire Safety Services</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-red-700 h-2"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Fire Door Inspection</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive inspections of all internal fire doors to ensure compliance with the Regulatory Reform (Fire Safety) Order 2005.
                </p>
                <ul className="text-gray-600 mb-6 space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Door integrity assessment
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Gap measurements and seals check
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Ironmongery inspection
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Detailed compliance reports
                  </li>
                </ul>
                <Link href="/services/fire-door-inspection" className="text-red-700 font-semibold hover:underline">
                  Learn more →
                </Link>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-red-700 h-2"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Fire Risk Assessment</h3>
                <p className="text-gray-600 mb-4">
                  Thorough assessment of fire risks in your property with actionable recommendations to ensure legal compliance.
                </p>
                <ul className="text-gray-600 mb-6 space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Comprehensive property inspection
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Identification of fire hazards
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Evacuation route assessment
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Prioritized action recommendations
                  </li>
                </ul>
                <Link href="#contact" className="text-red-700 font-semibold hover:underline">
                  Learn more →
                </Link>
              </div>
            </div>

            {/* Service 3 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-red-700 h-2"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Compliance Consulting</h3>
                <p className="text-gray-600 mb-4">
                  Expert guidance on fire safety regulations for HMOs, hotels, and commercial properties.
                </p>
                <ul className="text-gray-600 mb-6 space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Regulatory compliance guidance
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Staff training recommendations
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Documentation review
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-700 mr-2">✓</span>
                    Ongoing support
                  </li>
                </ul>
                <Link href="#contact" className="text-red-700 font-semibold hover:underline">
                  Learn more →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Testimonial 
              quote="The inspection was thorough and professional. The report was detailed and helped us prioritize our maintenance schedule efficiently."
              author="James Wilson"
              role="Property Manager, Wilson Hotels"
            />
            <Testimonial 
              quote="As an HMO landlord, I needed to ensure full compliance. Their service was exceptional, and they highlighted issues I wasn't even aware of."
              author="Sarah Thompson"
              role="HMO Owner"
            />
            <Testimonial 
              quote="The team's knowledge of regulations is impressive. They provided clear guidance on how to bring our building up to code."
              author="Michael Chen"
              role="Facilities Director, Parkview Residential"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Fire Safety Compliance</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-600 mb-4">
                Building owners are legally obligated to adhere to the requirements outlined in the Regulatory Reform (Fire Safety) Order 2005, which covers the building's fire safety provisions. Regular inspections of fire doors are required to maintain the standard of fire safety in buildings, as stated in BS8214 (c.13) and BS9999 (Annex L).
              </p>
              <p className="text-gray-600 mb-4">
                It is a common occurrence that the performance of a building's fire door(s) has been compromised by either damage, removal of ironmongery or changes to the door furniture, or just general wear and tear. This is especially present in high traffic buildings such as schools, offices, and hospitality. Without adequate protection, the lives of occupants within the building will be at risk.
              </p>
              <h3 className="text-xl font-bold mt-6 mb-3">Who needs fire doors?</h3>
              <p className="text-gray-600 mb-4">
                Fire doors are a legal requirement in all non-domestic properties, such as businesses, commercial premises, and public buildings. They are also required in blocks of flats and houses of multiple occupancy (HMOs).
              </p>
              <h3 className="text-xl font-bold mt-6 mb-3">Who is responsible?</h3>
              <p className="text-gray-600 mb-4">
                As set out by the Regulatory Reform (Fire Safety) Order 2005, building operators in England and Wales should appoint a 'Responsible Person' to manage all fire safety precautions including fire doors. This person might be the employer, the managing agent or owner or another appointed person.
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                We&apos;re committed to ensuring your building&apos;s fire safety compliance.
              </p>
              <p className="mt-4 text-gray-600">
                Let&apos;s work together to protect what matters most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Properties We Serve */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Properties We Serve</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-red-700 text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold mb-2">HMOs</h3>
              <p className="text-gray-600">Houses of Multiple Occupancy require strict fire safety compliance</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-red-700 text-4xl mb-4">🏨</div>
              <h3 className="text-xl font-bold mb-2">Hotels</h3>
              <p className="text-gray-600">Ensure guest safety with proper fire door inspections</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-red-700 text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold mb-2">Public Buildings</h3>
              <p className="text-gray-600">Maintain compliance in schools, hospitals and public spaces</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-red-700 text-4xl mb-4">🏬</div>
              <h3 className="text-xl font-bold mb-2">Commercial</h3>
              <p className="text-gray-600">Protect businesses and meet legal fire safety requirements</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Scale */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Scalable Inspection Services</h2>
            <p className="text-center text-gray-600 mb-12">
              We provide fire door inspection services for properties of all sizes, from small HMOs to large commercial complexes.
              Our pricing is structured based on the number of doors that require inspection.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="text-red-700 text-4xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Small Properties</h3>
                <p className="text-gray-600 mb-2">20-100 doors</p>
                <p className="text-gray-600 mb-4">Ideal for HMOs and small apartment buildings</p>
                <Link href="#contact" className="text-red-700 font-semibold hover:underline">Get a quote →</Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg text-center relative">
                <div className="absolute top-0 right-0 bg-red-700 text-white px-3 py-1 text-sm rounded-bl-lg rounded-tr-lg font-medium">
                  Most Common
                </div>
                <div className="text-red-700 text-4xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Medium Properties</h3>
                <p className="text-gray-600 mb-2">100-1000 doors</p>
                <p className="text-gray-600 mb-4">Suitable for hotels and medium-sized commercial buildings</p>
                <Link href="#contact" className="text-red-700 font-semibold hover:underline">Get a quote →</Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="text-red-700 text-4xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Large Properties</h3>
                <p className="text-gray-600 mb-2">1000+ doors</p>
                <p className="text-gray-600 mb-4">For large commercial complexes and institutional buildings</p>
                <Link href="#contact" className="text-red-700 font-semibold hover:underline">Get a quote →</Link>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-6">
                All inspections include detailed documentation and comprehensive reports highlighting any non-compliant doors with recommendations for remediation.
              </p>
              <Link 
                href="#contact"
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-md transition-colors"
              >
                Request Custom Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Request a Free Quote</h2>
            <ContactForm />
            <div className="mt-12 text-center">
              <p className="text-xl">Or call us directly at</p>
              <p className="text-2xl font-bold mt-2">07361 991991</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Fire Safety Services</h3>
              <p className="text-gray-400 mt-2">Professional Fire Door Inspections & Assessments</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <Link href="#services" className="hover:text-red-500 transition-colors">Services</Link>
              <Link href="#about" className="hover:text-red-500 transition-colors">About</Link>
              <Link href="#contact" className="hover:text-red-500 transition-colors">Contact</Link>
              <Link href="#" className="hover:text-red-500 transition-colors">Privacy Policy</Link>
            </div>
          </div>
          
          {/* Social Media Links */}
          <div className="mt-6 flex justify-center space-x-6">
            <a 
              href="https://twitter.com/fireregsco" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
            <a 
              href="https://facebook.com/fireregsco" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
              aria-label="Facebook"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a 
              href="https://instagram.com/fireregsco" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-600 transition-colors"
              aria-label="Instagram"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a 
              href="tel:07361991991" 
              className="text-gray-400 hover:text-green-500 transition-colors"
              aria-label="Phone"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM5.03 5h1.5c.07.88.22 1.75.45 2.58l-1.2 1.21c-.4-1.21-.66-2.47-.75-3.79zM19 18.97c-1.32-.09-2.6-.35-3.8-.76l1.2-1.2c.85.24 1.72.39 2.6.45v1.51z" />
              </svg>
            </a>
            <a 
              href="mailto:infofireregsco@gmail.com" 
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Email"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Fire Safety Services. All rights reserved.</p>
        </div>
      </div>
      </footer>
    </main>
  );
}
