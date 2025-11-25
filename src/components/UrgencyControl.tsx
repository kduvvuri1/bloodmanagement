//UrgencyControl.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { UrgencyMeter } from "./UrgencyMeter";
import { AlertCircle, Power, PowerOff } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface UrgencyControlProps {
  onUrgencyChange?: (level: number, enabled: boolean, message: string, bloodType: string) => void;
}

export function UrgencyControl({ onUrgencyChange }: UrgencyControlProps) {
  const [urgencyLevel, setUrgencyLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("Blood urgently needed");
  const [bloodType, setBloodType] = useState<string>("O+");

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onUrgencyChange?.(urgencyLevel, newState, message, bloodType);
  };

  const handleLevelChange = (level: 1 | 2 | 3 | 4 | 5) => {
    setUrgencyLevel(level);
    if (isEnabled) {
      onUrgencyChange?.(level, isEnabled, message, bloodType);
    }
  };

  const handleBloodTypeChange = (type: string) => {
    setBloodType(type);
    if (isEnabled) {
      onUrgencyChange?.(urgencyLevel, isEnabled, message, type);
    }
  };

  const urgencyLabels = {
    1: "Low",
    2: "Moderate",
    3: "Medium",
    4: "High",
    5: "Critical"
  };

  return (
    <Card className={isEnabled ? "border-[#D72638] border-2" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D72638]" />
              Urgency Alert System
            </CardTitle>
            <CardDescription>Broadcast urgent blood requests to donors</CardDescription>
          </div>
          <Badge 
            variant={isEnabled ? "default" : "outline"}
            className={isEnabled ? "bg-[#D72638] text-white" : ""}
          >
            {isEnabled ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blood Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="blood-type">Blood Type Needed</Label>
          <Select value={bloodType} onValueChange={handleBloodTypeChange}>
            <SelectTrigger id="blood-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Urgency Level Selector */}
        <div className="space-y-3">
          <Label>Urgency Level</Label>
          <div className="flex items-center gap-4">
            <UrgencyMeter level={urgencyLevel} size="lg" />
            <div className="flex-1">
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleLevelChange(level)}
                    className={`flex-1 py-2 px-3 rounded border-2 transition-all ${
                      urgencyLevel === level
                        ? "border-[#D72638] bg-[#D72638] text-white"
                        : "border-[#F3F4F6] bg-white text-[#333333] hover:border-[#D72638]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-sm text-[#333333] opacity-60 mt-2">
                Current: <span className="text-[#D72638]">{urgencyLabels[urgencyLevel]}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="urgency-message">Alert Message</Label>
          <Textarea
            id="urgency-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter the blood type and urgency details..."
            className="min-h-20"
          />
        </div>

        {/* Enable/Disable Toggle */}
        <Button
          onClick={handleToggle}
          className={`w-full ${
            isEnabled
              ? "bg-gray-500 hover:bg-gray-600"
              : "bg-[#D72638] hover:bg-[#A61B2B]"
          } text-white`}
        >
          {isEnabled ? (
            <>
              <PowerOff className="w-4 h-4 mr-2" />
              Disable Alert
            </>
          ) : (
            <>
              <Power className="w-4 h-4 mr-2" />
              Enable Alert
            </>
          )}
        </Button>

        {isEnabled && (
          <div className="p-4 bg-[#D72638] bg-opacity-10 border border-[#D72638] rounded-lg">
            <p className="text-sm text-[#D72638]">
              Alert is now broadcasting to eligible donors in your area
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
