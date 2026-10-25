import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import CloudConvert from 'cloudconvert';

export async function POST(req) {
  try {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'CloudConvert API key is missing' },
        { status: 500 }
      );
    }

    const supabase = getSupabaseClient();
    const cloudconvert = new CloudConvert(apiKey);

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const timestamp = Date.now();
    const originalFileName = `${timestamp}-${file.name}`;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(originalFileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(originalFileName);

    const job = await cloudconvert.jobs.create({
      tasks: {
        'import-file': {
          operation: 'import/url',
          url: publicUrlData.publicUrl,
        },
        'convert-file': {
          operation: 'convert',
          input: 'import-file',
          input_format: fileExtension,
          output_format: 'pdf',
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file',
        },
      },
    });

    const completedJob = await cloudconvert.jobs.wait(job.id);
    const exportTask = completedJob.tasks.find((task) => task.name === 'export-file');

    if (!exportTask || !exportTask.result || !exportTask.result.files[0]) {
      return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: exportTask.result.files[0].url,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}