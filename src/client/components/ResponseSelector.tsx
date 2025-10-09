import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card.js';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/client/components/ui/accordion.js';
import { Button } from '@/client/components/ui/button.js';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export interface ResponseOption {
  id: string;
  name: string;
  desc?: string;
  serviceType: string;
}

export interface ServiceConfig {
  desc: string;
  name: string;
  defaultResponse: string;
  responses: ResponseOption[];
}

interface ResponseSelectorProps {
  services: Record<string, ServiceConfig>;
  onGenerate: (serviceSelections: Record<string, string>) => Promise<void>;
  isLoading: boolean;
}

export function ResponseSelector({ services, onGenerate, isLoading }: ResponseSelectorProps) {
  const getDefaultSelections = () => {
    const defaults: Record<string, ResponseOption> = {};
    Object.entries(services).forEach(([serviceType, serviceConfig]) => {
      if (serviceConfig.responses.length > 0) {
        const defaultOpt: ResponseOption = serviceConfig.defaultResponse
          ? serviceConfig.responses.find(it => it.id === serviceConfig.defaultResponse) ?? serviceConfig.responses[0]
          : serviceConfig.responses[0];
        defaults[serviceType] = {
          ...defaultOpt,
          serviceType
        };
      }
    });
    return defaults;
  };

  const [selectedOptions, setSelectedOptions] = useState<Record<string, ResponseOption>>(getDefaultSelections());
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  const handleOptionSelect = (option: ResponseOption) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option.serviceType]: option
    }));
  };

  const handleGenerate = async () => {
    const serviceSelections: Record<string, string> = {};
    Object.values(selectedOptions).forEach(option => {
      serviceSelections[option.serviceType] = option.id;
    });
    
    if (Object.keys(serviceSelections).length > 0) {
      await onGenerate(serviceSelections);
    }
  };

  const groupedOptions = Object.entries(services).reduce((acc, [serviceType, serviceConfig]) => {
    const options = serviceConfig.responses.map(response => ({
      ...response,
      serviceType
    }));
    
    // Sort options to display default first
    const defaultId = serviceConfig.defaultResponse;
    if (defaultId) {
      options.sort((a, b) => {
        if (a.id === defaultId) return -1;
        if (b.id === defaultId) return 1;
        return 0;
      });
    }
    
    acc[serviceType] = options;
    return acc;
  }, {} as Record<string, ResponseOption[]>);

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold">Generate Mock Responses</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select response types for each service to generate mock data
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions} className="space-y-2">
            {Object.entries(groupedOptions).map(([serviceType, options]) => (
              <AccordionItem 
                key={serviceType} 
                value={serviceType}
                className="border border-border rounded-lg px-4 bg-background/50 hover:bg-background/80 transition-colors overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-md bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-semibold text-foreground">{services[serviceType].name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({options.length} {options.length === 1 ? 'option' : 'options'})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground text-left mt-1">
                        {services[serviceType].desc}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-3 pt-2 pb-4">
                    {options.map((option) => (
                      <button
                        key={`${option.serviceType}-${option.id}`}
                        className={`group relative flex items-center gap-2 px-5 py-3 rounded-full border-2 cursor-pointer transition-all duration-200 font-medium text-sm capitalize ${
                          selectedOptions[option.serviceType]?.id === option.id
                            ? 'border-primary bg-primary/10 text-primary shadow-md'
                            : 'border-border text-foreground hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm'
                        }`}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <span>{option.name}</span>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="pt-2">
            <Button
              onClick={handleGenerate}
              disabled={Object.keys(selectedOptions).length === 0 || isLoading}
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Generating Mock Data...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Generate Mock Responses
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
