import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import CloudConvert from 'cloudconvert';

const cloudconvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const timestamp = Date.now();
    const originalFileName = `${timestamp}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(originalFileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(originalFileName);

    const inputUrl = publicUrlData.publicUrl;

    const job = await cloudconvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/url',
          url: inputUrl,
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          output_format: 'pdf',
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file',
        },
      },
    });

    const queuedJob = await cloudconvert.jobs.wait(job.id);
    const exportTask = queuedJob.tasks.find((task) => task.name === 'export-my-file');
    const convertedFileUrl = exportTask.result.files[0].url;

    return NextResponse.json({
      success: true,
      url: convertedFileUrl,
      message: 'File successfully converted!',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}