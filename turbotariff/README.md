# TurboTariff Dashboard

A modern web application for automating tariff form generation and compliance tracking.

## Features

- **Tariff Form Generation**
  - Upload packing lists (Excel/CSV)
  - Manual packing list entry
  - Smart suggestions for item descriptions and HS codes
  - Image upload for items
  - Real-time progress tracking
  - PDF form generation
  - Tariff rate insights and risk management

- **Calendar & News**
  - Compliance date tracking
  - Tariff-related news feed
  - Interactive calendar interface

## Tech Stack

- **Frontend**
  - Next.js
  - React
  - Tailwind CSS
  - TypeScript
  - React Query
  - React Hook Form
  - React Dropzone
  - React Calendar

- **Backend**
  - Next.js API Routes
  - Python (for PDF generation)
  - Anthropic Claude API (for LLM integration)

## Prerequisites

- Node.js 18+
- Python 3.8+
- Anthropic API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/turbotariff.git
   cd turbotariff
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd turbotariff
   npm install

   # Install Python dependencies
   cd ..
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   ```

   Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   cd turbotariff
   npm run dev
   ```

## Project Structure

```
turbotariff/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload-packing-list/
│   │   │   ├── smart-suggestions/
│   │   │   ├── generate-tariff-form/
│   │   │   ├── compliance-dates/
│   │   │   └── news/
│   │   └── dashboard/
│   ├── components/
│   │   └── dashboard/
│   │       ├── TariffFormModule.tsx
│   │       ├── CalendarModule.tsx
│   │       ├── SmartSuggestions.tsx
│   │       ├── ProgressTracker.tsx
│   │       └── InsightsPanel.tsx
│   └── lib/
│       └── api.ts
├── public/
│   └── output/
└── code/
    └── pdf_writer/
        ├── pdf_writer.py
        └── CBP_Form_7501.pdf
```

## Usage

1. **Tariff Form Generation**
   - Upload a packing list spreadsheet or create a manual list
   - Review and edit item descriptions
   - Upload images for better item identification
   - Accept smart suggestions for improved descriptions and HS codes
   - Generate the tariff form
   - Review insights and risk management information

2. **Calendar & News**
   - View upcoming compliance dates
   - Track tariff-related news
   - Filter events by type

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
