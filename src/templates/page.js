import Blockquote from '../components/Blockquote';
import CodeBlock from '../components/CodeBlock';
import CodeColumns from '../components/CodeColumns';
import ExpansionPanel from '../components/ExpansionPanel';
import Footer from '../components/Footer';
import Header, {TOTAL_HEADER_HEIGHT} from '../components/Header';
import InlineCode from '../components/InlineCode';
import MultiCodeBlock, {
  MultiCodeBlockContext
} from '../components/MultiCodeBlock';
import PropTypes from 'prop-types';
import React, {Fragment, createElement, useContext, useMemo} from 'react';
import RelativeLink from '../components/RelativeLink';
import Sidebar, {SIDEBAR_WIDTH} from '../components/Sidebar';
import TableOfContents from '../components/TableOfContents';
import TypeScriptApiBox from '../components/TypeScriptApiBox';
import Wrapper from '../components/Wrapper';
import autolinkHeadings from 'rehype-autolink-headings';
import path, {dirname} from 'path';
import rehypeReact from 'rehype-react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import {
  Box,
  Button,
  Divider,
  Fade,
  Flex,
  Heading,
  IconButton,
  ListItem,
  OrderedList,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  UnorderedList,
  chakra,
  useToken
} from '@chakra-ui/react';
import {FaDiscourse, FaGithub} from 'react-icons/fa';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
  FiStar
} from 'react-icons/fi';
import {Link as GatsbyLink, graphql} from 'gatsby';
import {GatsbySeo} from 'gatsby-plugin-next-seo';
import {Global} from '@emotion/react';
import {MDXProvider} from '@mdx-js/react';
import {MDXRenderer} from 'gatsby-plugin-mdx';
import {PathContext} from '../utils';
import {YouTube} from 'mdx-embed';
import {getFullPath, isPathActive} from '../components/NavItems';
import {rehype} from 'rehype';

function PaginationButton({item, label, ...props}) {
  const {basePath} = useContext(PathContext);
  return (
    <Button
      h="auto"
      py="2"
      variant="ghost"
      as={GatsbyLink}
      to={getFullPath(item.path, basePath)}
      {...props}
    >
      <div>
        <Box
          textTransform="uppercase"
          letterSpacing="wider"
          fontWeight="normal"
          fontSize="xs"
        >
          {label}
        </Box>
        <Box fontSize="lg">{item.title}</Box>
      </div>
    </Button>
  );
}

PaginationButton.propTypes = {
  item: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired
};

const LIST_SPACING = 2;

const components = {
  h1: props => <Heading as="h1" size="3xl" {...props} />,
  h2: props => <Heading as="h2" size="2xl" {...props} />,
  h3: props => <Heading as="h3" size="xl" {...props} />,
  h4: props => <Heading as="h4" size="lg" {...props} />,
  h5: props => <Heading as="h5" size="md" {...props} />,
  h6: props => <Heading as="h6" size="sm" {...props} />,
  ul: props => <UnorderedList spacing={LIST_SPACING} {...props} />,
  ol: props => <OrderedList spacing={LIST_SPACING} {...props} />,
  li: ListItem,
  p: Text,
  a: RelativeLink,
  pre: CodeBlock,
  table: Table,
  thead: Thead,
  tbody: Tbody,
  tr: Tr,
  th: Th,
  td: Td,
  blockquote: Blockquote
};

const mdxComponents = {
  ...components,
  wrapper: Wrapper,
  inlineCode: InlineCode,
  Button,
  ExpansionPanel,
  MultiCodeBlock,
  YouTube,
  CodeColumns,
  TypescriptApiBox: TypeScriptApiBox
};

const {processSync} = rehype()
  .data('settings', {fragment: true})
  .use(autolinkHeadings, {behavior: 'wrap'})
  .use(rehypeReact, {
    createElement,
    Fragment,
    components: {
      ...components,
      code: InlineCode
    }
  });

const flattenNavItems = navItems =>
  navItems.flatMap(navItem =>
    navItem.children ? flattenNavItems(navItem.children) : navItem
  );

export default function PageTemplate({data, uri, pageContext}) {
  const paddingTop = useToken('space', 10);
  const paddingBottom = useToken('space', 12);
  const scrollPaddingTop = useMemo(
    () => `calc(${paddingTop} + ${TOTAL_HEADER_HEIGHT}px)`,
    [paddingTop]
  );

  const [language, setLanguage] = useLocalStorage('language');
  const [sidebarHidden, setSidebarHidden] = useLocalStorage('sidebar');

  const {siteUrl} = data.site.siteMetadata;
  const {
    name,
    childMdx,
    childMarkdownRemark,
    basePath,
    gitRemote,
    relativePath
  } = data.file;

  const {frontmatter, headings} = childMdx || childMarkdownRemark;
  const {title, description} = frontmatter;
  const {docset, versions, currentVersion, navItems} = pageContext;

  const [prevItem, nextItem] = useMemo(() => {
    const flatNavItems = flattenNavItems(navItems).filter(navItem =>
      // only include local pages
      navItem.path.startsWith('/')
    );
    const currentIndex = flatNavItems.findIndex(navItem => {
      const fullPath = getFullPath(navItem.path, basePath);
      return isPathActive(fullPath, uri);
    });

    return [flatNavItems[currentIndex - 1], flatNavItems[currentIndex + 1]];
  }, [navItems, basePath, uri]);

  return (
    <>
      <GatsbySeo
        title={title}
        description={description}
        canonical={siteUrl + uri}
        openGraph={{
          title,
          description
        }}
      />
      <Global
        styles={{
          html: {
            scrollPaddingTop
          }
        }}
      />
      <PathContext.Provider
        value={{
          uri,
          basePath,
          path: name === 'index' ? uri : dirname(uri)
        }}
      >
        <Header
          docset={docset}
          versions={versions}
          currentVersion={currentVersion}
        />
        <Fade in={sidebarHidden} unmountOnExit delay={0.25}>
          <Tooltip placement="right" label="Show sidebar">
            <IconButton
              pos="fixed"
              mt="2"
              left="2"
              size="sm"
              variant="outline"
              fontSize="md"
              icon={<FiChevronsRight />}
              css={{top: TOTAL_HEADER_HEIGHT}}
              onClick={() => setSidebarHidden(false)}
            />
          </Tooltip>
        </Fade>
        <Sidebar
          navItems={navItems}
          isHidden={sidebarHidden}
          onHide={() => setSidebarHidden(true)}
        />
        <Box
          marginLeft={{base: 0, md: sidebarHidden ? 0 : SIDEBAR_WIDTH}}
          transitionProperty="margin-left"
          transitionDuration="normal"
        >
          <Flex
            maxW="6xl"
            align="flex-start"
            px="10"
            as="main"
            sx={{
              paddingTop,
              paddingBottom
            }}
          >
            <Box flexGrow="1" w="0">
              <Heading size="3xl">{title}</Heading>
              {description && (
                <Heading mt="4" fontWeight="normal">
                  {description}
                </Heading>
              )}
              <Divider my="8" />
              <MultiCodeBlockContext.Provider value={{language, setLanguage}}>
                {childMdx ? (
                  <MDXProvider components={mdxComponents}>
                    <MDXRenderer>{childMdx.body}</MDXRenderer>
                  </MDXProvider>
                ) : (
                  <Wrapper>
                    {processSync(childMarkdownRemark.html).result}
                  </Wrapper>
                )}
              </MultiCodeBlockContext.Provider>
              <Flex mt="10">
                {prevItem && (
                  <PaginationButton
                    label="Previous"
                    item={prevItem}
                    leftIcon={<FiChevronLeft />}
                    pl="3"
                  />
                )}
                {nextItem && (
                  <PaginationButton
                    ml="auto"
                    textAlign="right"
                    label="Next"
                    rightIcon={<FiChevronRight />}
                    item={nextItem}
                    pr="3"
                  />
                )}
              </Flex>
            </Box>
            {uri !== '/' && (
              // hide the table of contents on the home page
              <chakra.aside
                display={{base: 'none', lg: 'flex'}}
                flexDirection="column"
                ml="10"
                w="250px"
                flexShrink="0"
                pos="sticky"
                top={scrollPaddingTop}
                maxH={`calc(100vh - ${scrollPaddingTop} - ${paddingBottom})`}
              >
                <Heading size="md" mb="3">
                  {title}
                </Heading>
                <TableOfContents headings={headings} />
                <Stack align="flex-start" spacing="3" mt="8">
                  <Button
                    onClick={() => window.freddyWidget?.show()}
                    variant="link"
                    size="lg"
                    leftIcon={<FiStar />}
                  >
                    Rate article
                  </Button>
                  {gitRemote && (
                    <Button
                      as="a"
                      href={[
                        gitRemote.href,
                        'tree',
                        gitRemote.ref,
                        relativePath
                      ].join(path.sep)}
                      variant="link"
                      size="lg"
                      leftIcon={<FaGithub />}
                    >
                      Edit on GitHub
                    </Button>
                  )}
                  <Button
                    as="a"
                    href="https://community.apollographql.com/"
                    variant="link"
                    size="lg"
                    leftIcon={<FaDiscourse />}
                  >
                    Discuss in forums
                  </Button>
                </Stack>
              </chakra.aside>
            )}
          </Flex>
          <Footer />
        </Box>
      </PathContext.Provider>
    </>
  );
}

PageTemplate.propTypes = {
  data: PropTypes.object.isRequired,
  uri: PropTypes.string.isRequired,
  pageContext: PropTypes.object.isRequired
};

export const pageQuery = graphql`
  query GetPage($id: String!) {
    site {
      siteMetadata {
        siteUrl
      }
    }
    file(id: {eq: $id}) {
      name
      basePath: sourceInstanceName
      relativePath
      gitRemote {
        href
        ref
      }
      childMdx {
        body
        headings {
          depth
          value
        }
        frontmatter {
          title
          description
        }
      }
      childMarkdownRemark {
        html
        htmlAst
        headings {
          depth
          value
        }
        frontmatter {
          title
          description
        }
      }
    }
  }
`;
