Support Ticket App

## Team Members: 
1. Arvin Cautivar
2. Jancel Venales

## GitHub Repository: 
https://github.com/rvinnz/SupportTicket.git

## Tech Stack
- React Native / Expo
- Cloudinary (Image Hosting)
- EmailJS (Email Delivery)

## Setup Instructions
1. Clone the repository.
2. Run `npm install` to install all dependencies.
3. Create a `.env` file in the root directory. Do not commit this file.
4. Populate the `.env` file using the required variables listed below.
5. Run `npx expo start -c` to clear the cache and launch the app.

## Required Environment Variables
Your `.env` file must contain these exact keys:
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
EXPO_PUBLIC_EMAILJS_SERVICE_ID
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY