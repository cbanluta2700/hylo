import { useState } from 'react';
import TripDetails from './components/TripDetails';
import TravelStyle from './components/TravelStyle';
import { FormData } from './components/TripDetails/types';
import { TravelStyleFormData } from './components/TravelStyle/types';

function App() {
  const [tripFormData, setTripFormData] = useState<FormData>({
    location: '',
    departDate: '',
    returnDate: '',
    flexibleDates: false,
    adults: 2,
    children: 0,
    childrenAges: [],
    budget: 5000,
    currency: 'USD',
    selectedGroups: [],
    selectedInterests: [],
    selectedInclusions: [],
  });

  const [travelStyleData, setTravelStyleData] = useState<TravelStyleFormData>({
    experience: [],
    vibes: [],
    sampleDays: [],
    dinnerChoices: [],
    nickname: '',
  });

  return (
    <div className="min-h-screen bg-primary py-8">
      <main className="max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          {/* Trip Details Section */}
          <div>
            <div className="bg-trip-details text-primary py-4 px-6 shadow-lg">
              <h1 className="text-2xl font-bold text-center">TRIP DETAILS</h1>
            </div>
            <TripDetails
              formData={tripFormData}
              onFormChange={setTripFormData}
              showAdditionalForms={true}
            />
          </div>

          {/* Travel Style Section */}
          <div>
            <div className="bg-trip-details text-primary py-4 px-6 shadow-lg">
              <h1 className="text-2xl font-bold text-center">TRAVEL STYLE</h1>
            </div>
            <TravelStyle formData={travelStyleData} onFormChange={setTravelStyleData} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
