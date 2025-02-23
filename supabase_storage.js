const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejswwbuabfsuefmepjtm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc3d3YnVhYmZzdWVmbWVwanRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMTUyMzMsImV4cCI6MjA1NTg5MTIzM30.sF0I6W-hQkcWwggAzaB1DRLWKSUS7sNh-A6HX50O9Ik'
);

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const fileContent = JSON.stringify(numbers, null, 2);

const file = new File([fileContent], 'example.txt', { type: 'text/plain' });

const runscript = async () => {
  const { data, error } = await supabase.storage
    .from('scrapy')
    .upload('example.txt', file);

  if (error) {
    console.error('Error uploading file:', error);
  } else {
    console.log('File uploaded successfully:', data);
  }
};

runscript();