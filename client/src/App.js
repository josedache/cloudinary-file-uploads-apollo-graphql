import React, { useCallback } from "react";
import "./App.css";
import { gql } from "apollo-boost";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useDropzone } from "react-dropzone";

const SERVER_URI = process.env.REACT_APP_SERVER_URI;
const FRAGMENT_ON_FILE = gql`
  fragment FileFragment on File {
    filename
    mimetype
    publicUri
    width
    height
    extension
    size
  }
`;
const UPLOAD_FILES = gql`
  mutation UploadFiles($files: [Upload!]!) {
    uploadFiles(files: $files) {
      ...FileFragment
    }
  }
  ${FRAGMENT_ON_FILE}
`;
const GET_UPLOADS = gql`
  query GetFiles {
    uploads {
      ...FileFragment
    }
  }
  ${FRAGMENT_ON_FILE}
`;

function App() {
  const { data = { uploads: [] }, refetch } = useQuery(GET_UPLOADS);
  const [mutationUpload] = useMutation(UPLOAD_FILES);

  const onDrop = useCallback(
    async (files) => {
      try {
        const result = await mutationUpload({ variables: { files } });
        console.log(result);
        await refetch();
      } catch (error) {
        console.error(error);
      }
    },
    [mutationUpload, refetch]
  );

  const { isDragActive, getRootProps, getInputProps } = useDropzone({
    multiple: true,
    onDrop,
  });

  return (
    <div className="App">
      <div className="Header">
        <div
          {...getRootProps({
            className: "DropZone",
          })}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag 'n' drop some files here, or click to select files</p>
          )}
        </div>
      </div>
      <div>
        <h6 className="Title">UPLOADS</h6>
        <div className="Files">
          {data.uploads.map((file, index) => (
            <UploadedFile file={file} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadedFile(props) {
  const {
    filename,
    mimetype,
    publicUri,
    width,
    height,
    extension,
    size,
  } = props.file;
  return (
    <div className="File">
      {mimetype.includes("image/") ? (
        <img src={publicUri} width="100%" height="100%" alt="File" />
      ) : null}
      <div className="File-Name">{filename}</div>
    </div>
  );
}

export default App;
