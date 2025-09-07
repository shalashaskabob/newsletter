import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

export default function RichText({ value, onChange, placeholder }: Props) {
  return (
    <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} placeholder={placeholder} />
  );
}


