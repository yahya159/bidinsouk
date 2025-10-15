'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Title, 
  Text, 
  TextInput, 
  Textarea, 
  Select, 
  Button,
  Paper,
  Group,
  NumberInput,
  MultiSelect,
  Stack,
  Grid
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

export default function BecomeVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const form = useForm({
    initialValues: {
      businessName: '',
      businessDescription: '',
      businessType: 'COMPANY',
      phoneNumber: '',
      businessEmail: '',
      businessAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      taxId: '',
      businessRegNumber: '',
      yearsInBusiness: 0,
      estimatedMonthlyVolume: '',
      productCategories: []
    },
    validate: {
      businessName: (value) => 
        value.length < 3 ? 'Business name must be at least 3 characters' : null,
      businessDescription: (value) =>
        value.length < 50 ? 'Description must be at least 50 characters' : null,
      phoneNumber: (value) =>
        !/^\+?[1-9]\d{1,14}$/.test(value) ? 'Invalid phone number format' : null,
      businessEmail: (value) =>
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email' : null,
      taxId: (value) =>
        value.length < 5 ? 'Tax ID must be at least 5 characters' : null
    }
  });
  
  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/vendor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }
      
      notifications.show({
        title: 'Application Submitted',
        message: 'Your vendor application has been submitted for review',
        color: 'green'
      });
      
      router.push('/vendor/pending');
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container size="md" py="xl">
      <Title order={1} mb="md">Become a Vendor</Title>
      <Text c="dimmed" mb="xl">
        Join our marketplace and start selling your products
      </Text>
      
      <Paper p="xl" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Title order={3}>Business Information</Title>
            
            <TextInput
              label="Business Name"
              placeholder="Your business name"
              required
              {...form.getInputProps('businessName')}
            />
            
            <Textarea
              label="Business Description"
              placeholder="Describe your business (minimum 50 characters)"
              required
              minRows={4}
              {...form.getInputProps('businessDescription')}
            />
            
            <Select
              label="Business Type"
              required
              data={[
                { value: 'INDIVIDUAL', label: 'Individual' },
                { value: 'COMPANY', label: 'Company' },
                { value: 'PARTNERSHIP', label: 'Partnership' }
              ]}
              {...form.getInputProps('businessType')}
            />
            
            <Title order={3} mt="xl">Contact Information</Title>
            
            <TextInput
              label="Phone Number"
              placeholder="+1234567890"
              required
              {...form.getInputProps('phoneNumber')}
            />
            
            <TextInput
              label="Business Email"
              placeholder="business@example.com"
              required
              {...form.getInputProps('businessEmail')}
            />
            
            <Title order={4} mt="md">Business Address</Title>
            
            <TextInput
              label="Street"
              required
              {...form.getInputProps('businessAddress.street')}
            />
            
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="City"
                  required
                  {...form.getInputProps('businessAddress.city')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="State"
                  required
                  {...form.getInputProps('businessAddress.state')}
                />
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Postal Code"
                  required
                  {...form.getInputProps('businessAddress.postalCode')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Country"
                  required
                  {...form.getInputProps('businessAddress.country')}
                />
              </Grid.Col>
            </Grid>
            
            <Title order={3} mt="xl">Legal Information</Title>
            
            <TextInput
              label="Tax ID"
              placeholder="Your tax identification number"
              required
              {...form.getInputProps('taxId')}
            />
            
            <TextInput
              label="Business Registration Number (Optional)"
              placeholder="Your business registration number"
              {...form.getInputProps('businessRegNumber')}
            />
            
            <Title order={3} mt="xl">Additional Information</Title>
            
            <NumberInput
              label="Years in Business"
              min={0}
              max={100}
              {...form.getInputProps('yearsInBusiness')}
            />
            
            <Select
              label="Estimated Monthly Volume"
              data={[
                { value: 'LOW', label: 'Under $5,000' },
                { value: 'MEDIUM', label: '$5,000 - $20,000' },
                { value: 'HIGH', label: 'Over $20,000' }
              ]}
              {...form.getInputProps('estimatedMonthlyVolume')}
            />
            
            <MultiSelect
              label="Product Categories"
              placeholder="Select up to 5 categories"
              data={[
                'Electronics',
                'Fashion',
                'Home & Garden',
                'Sports',
                'Books',
                'Toys',
                'Food & Beverage'
              ]}
              maxValues={5}
              {...form.getInputProps('productCategories')}
            />
            
            <Button type="submit" loading={loading} size="lg" mt="xl" fullWidth>
              Submit Application
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
