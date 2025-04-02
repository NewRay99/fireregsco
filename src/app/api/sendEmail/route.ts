import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, formData } = body;

    console.log('Email configuration:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      secure: process.env.EMAIL_SECURE === 'true',
    });

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'infofireregsco@gmail.com',
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Send mail
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Fire Safety Services <infofireregsco@gmail.com>',
      to: 'infofireregsco@gmail.com', // Send to the company email
      subject: subject || 'New Fire Safety Inspection Request',
      html: html,
      replyTo: formData?.email || 'noreply@firesafetyservices.com',
    };

    console.log('Attempting to send email to:', mailOptions.to);

    // Always try to send the email in any environment
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: info.messageId
      });
    } catch (emailError) {
      console.error('SMTP Error:', emailError);
      throw emailError;
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 