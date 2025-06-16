
import React, { useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRound, Mail } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const Accounts: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Save to localStorage
    const userSettings = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    toast.success("Account settings saved successfully");
  };

  // Load settings on component mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setFirstName(settings.firstName || '');
        setLastName(settings.lastName || '');
        setEmail(settings.email || '');
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
          <div className="space-y-6">
            <div className="text-center pb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UserRound className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-[#dc2626] focus:border-[#dc2626]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-[#dc2626] focus:border-[#dc2626]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#dc2626] focus:border-[#dc2626]" 
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} className="w-full bg-[#dc2626] hover:bg-[#b91c1c]">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Accounts;
